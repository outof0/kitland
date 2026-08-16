import { vi } from "vitest";

describe("VS Code webview API", () => {
  it("is acquired once and shared by every webview module", async () => {
    vi.resetModules();
    const api = { postMessage: vi.fn<(message: unknown) => void>() };
    const acquire = vi.fn<() => typeof api>(() => api);
    vi.stubGlobal("acquireVsCodeApi", acquire);
    vi.stubGlobal("window", {
      addEventListener: vi.fn<(type: string, listener: unknown) => void>(),
    });

    const singleton = await import("../../src/webview/vscodeApi");
    await import("../../src/webview/App");
    await import("../../src/webview/useRegexTester");
    await import("../../src/webview/VscodeHostRuntime");

    expect(singleton.vscode).toBe(api);
    expect(acquire).toHaveBeenCalledTimes(1);
  });
});
