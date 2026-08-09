import * as vscode from "vscode";
import { PROTOCOL_MAX_DESCRIPTION_CHARS, PROTOCOL_MAX_ID_CHARS } from "./constants";
import { parseWebviewMessage, type HostMessage, type ToolInputLimit } from "./protocol";
import type { ToolAdapter } from "./toolAdapter";
import { renderWebviewHtml } from "./webviewHtml";

export class ToolPanel implements vscode.Disposable {
  static current: ToolPanel | undefined;

  static show(extensionUri: vscode.Uri, adapter: ToolAdapter, initialInput?: string): void {
    if (ToolPanel.current) {
      ToolPanel.current.panel.reveal(vscode.ViewColumn.Beside, true);
      ToolPanel.current.selectTool(adapter, initialInput);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "kitland.toolWorkbench",
      "Kitland Developer Tools",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: false,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "dist", "webview")],
      },
    );
    ToolPanel.current = new ToolPanel(panel, extensionUri, adapter, initialInput ?? "");
  }

  static disposeCurrent(): void {
    ToolPanel.current?.dispose();
  }

  private readonly disposables: vscode.Disposable[] = [];
  private adapter: ToolAdapter;
  private initialInput: string;
  private ready = false;
  private lastOutput: { toolId: string; value: string } | undefined;

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    adapter: ToolAdapter,
    initialInput: string,
  ) {
    this.adapter = adapter;
    this.initialInput = initialInput;
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
  }

  dispose(): void {
    if (ToolPanel.current !== this) return;
    ToolPanel.current = undefined;
    this.initialInput = "";
    this.lastOutput = undefined;
    for (const disposable of this.disposables.splice(0)) disposable.dispose();
    this.panel.dispose();
  }

  private selectTool(adapter: ToolAdapter, initialInput?: string): void {
    const changingTool = adapter.descriptor.id !== this.adapter.descriptor.id;
    this.adapter = adapter;
    if (changingTool) this.initialInput = "";
    if (initialInput !== undefined) this.initialInput = initialInput;
    this.lastOutput = undefined;
    this.updateTitle();
    if (this.ready && (changingTool || initialInput !== undefined)) this.postInit();
  }

  private updateTitle(): void {
    this.panel.title = `Kitland: ${this.adapter.descriptor.title}`;
  }

  private post(message: HostMessage): void {
    void this.panel.webview.postMessage(message);
  }

  private postInit(): void {
    const inputs: ToolInputLimit[] = [];
    for (const operation of this.adapter.descriptor.renderer.operations) {
      const maxInputChars = this.adapter.inputLimit(operation.id);
      if (maxInputChars !== undefined) inputs.push({ operationId: operation.id, maxInputChars });
    }
    this.post({
      type: "init",
      tool: this.adapter.descriptor,
      input: this.initialInput,
      limits: { inputs, maxOutputChars: this.adapter.maxOutputChars },
    });
  }

  private async handleMessage(rawMessage: unknown): Promise<void> {
    const message = parseWebviewMessage(rawMessage);
    if (!message) return;

    if (message.type === "ready") {
      this.ready = true;
      this.postInit();
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

    this.lastOutput = undefined;
    const limit = this.adapter.inputLimit(message.operationId);
    if (limit === undefined || message.input.length > limit) {
      this.lastOutput = undefined;
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
      const result = this.adapter.transform({
        operationId: message.operationId,
        optionId: message.optionId,
        input: message.input,
      });
      if (!result.ok) {
        this.lastOutput = undefined;
        this.postFailure(message.requestId, result.error.code, result.error.message);
        return;
      }
      if (result.value.length > this.adapter.maxOutputChars) {
        this.lastOutput = undefined;
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
      this.lastOutput = undefined;
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
