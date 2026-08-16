import * as vscode from "vscode";
import { PROTOCOL_MAX_DESCRIPTION_CHARS, PROTOCOL_MAX_ID_CHARS } from "./constants";
import { runRegexIsolated } from "./regexWorker";
import { parseWebviewMessage, type RegistryToolEntry, type HostMessage } from "./protocol";
import { getToolAdapter, listToolAdapters } from "./toolRegistry";
import type { ToolAdapter } from "./toolAdapter";
import { renderWebviewHtml } from "./webviewHtml";

export class ToolPanel implements vscode.Disposable {
  static current: ToolPanel | undefined;

  static show(
    extensionUri: vscode.Uri,
    adapter: ToolAdapter,
    initialInput?: string,
    collapseSidebar = true,
  ): void {
    if (ToolPanel.current) {
      ToolPanel.current.panel.reveal(vscode.ViewColumn.Active, false);
      ToolPanel.current.selectTool(adapter, initialInput, true, collapseSidebar);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "kitland.toolWorkbench",
      "Kitland Tools",
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "dist", "webview")],
      },
    );
    ToolPanel.current = new ToolPanel(
      panel,
      extensionUri,
      adapter,
      initialInput ?? "",
      collapseSidebar,
    );
  }

  static disposeCurrent(): void {
    ToolPanel.current?.dispose();
  }

  private readonly disposables: vscode.Disposable[] = [];
  private adapter: ToolAdapter;
  private initialInput: string;
  private collapseSidebar: boolean;
  private ready = false;
  private lastOutput: { toolId: string; value: string } | undefined;
  private latestExecutionRequestId = -1;

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    adapter: ToolAdapter,
    initialInput: string,
    collapseSidebar = true,
  ) {
    this.adapter = adapter;
    this.initialInput = initialInput;
    this.collapseSidebar = collapseSidebar;
    const scriptUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, "dist", "webview", "main.js"),
    );
    const styleUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, "dist", "webview", "main.css"),
    );
    panel.webview.html = renderWebviewHtml({
      cspSource: panel.webview.cspSource,
      scriptUri: scriptUri.toString(),
      styleUri: styleUri.toString(),
    });
    this.updateTitle();

    panel.onDidDispose(() => this.dispose(), undefined, this.disposables);
    panel.webview.onDidReceiveMessage(
      (message: unknown) => {
        void this.handleMessage(message);
      },
      undefined,
      this.disposables,
    );
    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme((theme) => {
        this.post({
          type: "themeChanged",
          kind: theme.kind === vscode.ColorThemeKind.Light ? "light" : "dark",
        });
      }),
    );
  }

  dispose(): void {
    if (ToolPanel.current !== this) return;
    ToolPanel.current = undefined;
    this.initialInput = "";
    this.lastOutput = undefined;
    for (const disposable of this.disposables.splice(0)) disposable.dispose();
    this.panel.dispose();
  }

  private selectTool(
    adapter: ToolAdapter,
    initialInput?: string,
    notifyWebview = true,
    collapseSidebar?: boolean,
  ): void {
    const changingTool = adapter.descriptor.id !== this.adapter.descriptor.id;
    this.adapter = adapter;
    if (changingTool) this.initialInput = "";
    if (initialInput !== undefined) this.initialInput = initialInput;
    if (collapseSidebar !== undefined) this.collapseSidebar = collapseSidebar;
    this.lastOutput = undefined;
    this.latestExecutionRequestId = -1;
    this.updateTitle();
    if (
      this.ready &&
      notifyWebview &&
      (changingTool || initialInput !== undefined || collapseSidebar !== undefined)
    ) {
      this.postToolsList();
    }
  }

  private updateTitle(): void {
    this.panel.title = `Kitland: ${this.adapter.descriptor.title}`;
  }

  private post(message: HostMessage): void {
    void this.panel.webview.postMessage(message);
  }

  private registryEntries(): RegistryToolEntry[] {
    return listToolAdapters().map((adapter) => ({
      id: adapter.registryTool.id,
      slug: adapter.registryTool.slug,
      shortName: adapter.registryTool.shortName,
      name: adapter.registryTool.name,
      description: adapter.registryTool.description,
      family: adapter.registryTool.family,
    }));
  }

  private postToolsList(): void {
    this.post({
      type: "toolsList",
      tools: this.registryEntries(),
      activeToolId: this.adapter.descriptor.id,
      initialInput: this.initialInput,
      collapseSidebar: this.collapseSidebar,
    });
  }

  private async handleMessage(rawMessage: unknown): Promise<void> {
    const message = parseWebviewMessage(rawMessage);
    if (!message) return;

    if (message.type === "ready" || message.type === "listTools") {
      this.ready = true;
      this.postToolsList();
      return;
    }

    if (message.type === "selectTool") {
      const adapter = getToolAdapter(message.toolId);
      if (!adapter) return;
      this.selectTool(adapter, undefined, false);
      return;
    }

    if (message.type === "regexTest") {
      const result = await runRegexIsolated(message.pattern, message.input, message.flags);
      this.post({ type: "regexResult", requestId: message.requestId, result });
      return;
    }

    const toolId = this.adapter.descriptor.id;
    if (message.toolId !== toolId) return;

    if (message.type === "clear") {
      this.lastOutput = undefined;
      return;
    }

    if (message.type === "copy") {
      await this.copyLastOutput(message.requestId);
      return;
    }

    if (message.requestId <= this.latestExecutionRequestId) return;
    this.latestExecutionRequestId = message.requestId;
    this.lastOutput = undefined;

    if (message.type === "inspect") {
      if (!("inspect" in this.adapter)) return;
      if (message.input.length > this.adapter.maxInputChars) {
        this.postInspectFailure(
          message.requestId,
          "INPUT_REJECTED",
          `Input exceeds the ${this.adapter.maxInputChars.toLocaleString()} UTF-16 code unit workbench limit.`,
        );
        return;
      }
      try {
        const result = this.adapter.inspect({
          operationId: message.operationId,
          optionId: message.optionId,
          input: message.input,
        });
        if (!result.ok) {
          this.postInspectFailure(message.requestId, result.error.code, result.error.message);
          return;
        }
        if (result.value.formatted.length > this.adapter.maxOutputChars) {
          this.postInspectFailure(
            message.requestId,
            "OUTPUT_TOO_LARGE",
            "Formatted JSON exceeds this workbench's output safety limit.",
          );
          return;
        }
        this.lastOutput = { toolId, value: result.value.formatted };
        this.post({
          type: "inspectResult",
          requestId: message.requestId,
          toolId,
          ok: true,
          inspection: result.value,
        });
      } catch {
        this.postInspectFailure(
          message.requestId,
          "INSPECTION_FAILED",
          "The local JSON inspection could not be completed.",
        );
      }
      return;
    }

    if (!("transform" in this.adapter)) return;
    const limit = this.adapter.inputLimit(message.operationId);
    if (limit === undefined || message.input.length > limit) {
      this.postFailure(
        message.requestId,
        "INPUT_REJECTED",
        limit === undefined
          ? "This tool does not support the requested operation."
          : `Input exceeds the ${limit.toLocaleString()} character safety limit.`,
      );
      return;
    }

    try {
      const result = await this.adapter.transform({
        operationId: message.operationId,
        optionId: message.optionId,
        input: message.input,
      });
      if (!result.ok) {
        this.postFailure(message.requestId, result.error.code, result.error.message);
        return;
      }
      if (result.value.length > this.adapter.maxOutputChars) {
        this.postFailure(
          message.requestId,
          "OUTPUT_TOO_LARGE",
          "Output exceeds this tool's workbench safety limit.",
        );
        return;
      }
      this.lastOutput = { toolId, value: result.value };
      this.post({
        type: "transformResult",
        requestId: message.requestId,
        toolId,
        ok: true,
        value: result.value,
      });
    } catch {
      this.postFailure(
        message.requestId,
        "TRANSFORM_FAILED",
        "The local transformation could not be completed.",
      );
    }
  }

  private postFailure(requestId: number, code: string, message: string): void {
    this.post({
      type: "transformResult",
      requestId,
      toolId: this.adapter.descriptor.id,
      ok: false,
      code: code.slice(0, PROTOCOL_MAX_ID_CHARS),
      message: message.slice(0, PROTOCOL_MAX_DESCRIPTION_CHARS),
    });
  }

  private postInspectFailure(requestId: number, code: string, message: string): void {
    this.lastOutput = undefined;
    this.post({
      type: "inspectResult",
      requestId,
      toolId: this.adapter.descriptor.id,
      ok: false,
      code: code.slice(0, PROTOCOL_MAX_ID_CHARS),
      message: message.slice(0, PROTOCOL_MAX_DESCRIPTION_CHARS),
    });
  }

  private async copyLastOutput(requestId: number): Promise<void> {
    const toolId = this.adapter.descriptor.id;
    const output = this.lastOutput;
    if (!output || output.toolId !== toolId || output.value.length > this.adapter.maxOutputChars) {
      this.post({
        type: "copyResult",
        requestId,
        toolId,
        ok: false,
        message: "Generate an output before copying.",
      });
      return;
    }

    try {
      await vscode.env.clipboard.writeText(output.value);
      this.post({ type: "copyResult", requestId, toolId, ok: true });
    } catch {
      this.post({
        type: "copyResult",
        requestId,
        toolId,
        ok: false,
        message: "VS Code could not write to the clipboard.",
      });
    }
  }
}
