export type VsCodeApi = {
  postMessage(message: unknown): void;
};

declare function acquireVsCodeApi(): VsCodeApi;

/**
 * VS Code permits acquiring its webview API exactly once for each document.
 * Every webview module must import this singleton instead of acquiring it again.
 */
export const vscode = acquireVsCodeApi();
