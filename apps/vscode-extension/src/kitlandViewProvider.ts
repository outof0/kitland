import * as vscode from "vscode";
import { PROTOCOL_MAX_DESCRIPTION_CHARS, PROTOCOL_MAX_ID_CHARS } from "./constants";
import { runRegexIsolated } from "./regexWorker";
import { parseWebviewMessage, type RegistryToolEntry, type HostMessage } from "./protocol";
import { getToolAdapter, listToolAdapters } from "./toolRegistry";
import type { ToolAdapter } from "./toolAdapter";
import { renderWebviewHtml } from "./webviewHtml";

export class KitlandViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "kitland.mainView";

  private view?: vscode.WebviewView;
  private adapter: ToolAdapter;
  private initialInput = "";
  private ready = false;
  private resolved = false;
  private lastOutput: { toolId: string; value: string } | undefined;
  private latestExecutionRequestId = -1;

  constructor(private readonly extensionUri: vscode.Uri) {
    this.adapter = listToolAdapters()[0]!;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist", "webview")],
    };

    // Set up the document and listeners exactly once. With
    // `retainContextWhenHidden` the view is reused across show/hide, so
    // re-resolving must not rewrite HTML (which remounts the React tree and
    // drops in-progress input) or stack another theme listener.
    if (this.resolved) return;
    this.resolved = true;

    const scriptUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview", "main.js"),
    );
    const styleUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview", "main.css"),
    );

    webviewView.webview.html = renderWebviewHtml({
      cspSource: webviewView.webview.cspSource,
      scriptUri: scriptUri.toString(),
      styleUri: styleUri.toString(),
    });

    webviewView.webview.onDidReceiveMessage((message: unknown) => {
      void this.handleMessage(message);
    });

    vscode.window.onDidChangeActiveColorTheme((theme) => {
      this.post({
        type: "themeChanged",
        kind: theme.kind === vscode.ColorThemeKind.Light ? "light" : "dark",
      });
    });
  }

  public selectTool(adapter: ToolAdapter, initialInput?: string): void {
    const changingTool = adapter.descriptor.id !== this.adapter.descriptor.id;
    this.adapter = adapter;
    if (changingTool) this.initialInput = "";
    if (initialInput !== undefined) this.initialInput = initialInput;
    this.lastOutput = undefined;
    this.latestExecutionRequestId = -1;
    if (this.ready) {
      this.postToolsList();
    }
  }

  public getActiveAdapter(): ToolAdapter {
    return this.adapter;
  }

  private post(message: HostMessage): void {
    void this.view?.webview.postMessage(message);
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
      // This webview already lives in VS Code's Activity Bar sidebar. Avoid
      // rendering a second desktop registry beside the active tool.
      collapseSidebar: true,
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
      // The activity-bar view is the workbench: switch the tool in place.
      // Opening a second ToolPanel editor would duplicate the React tree and
      // leak the previous tool's initialInput.
      this.selectTool(adapter, undefined);
      return;
    }

    // Regex execution is host-agnostic and runs isolated from the
    // extension-host event loop (worker_threads with deadline) so a
    // catastrophic pattern cannot freeze Kitland commands.
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
