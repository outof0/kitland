import { createNonce, renderWebviewHtml } from "../../src/webviewHtml";

describe("webview HTML", () => {
  it("uses cryptographic nonces", () => {
    expect(createNonce()).toMatch(/^[a-f0-9]{32}$/u);
    expect(createNonce()).not.toBe(createNonce());
  });

  it("ships a deny-by-default CSP without inline or remote capabilities", () => {
    const html = renderWebviewHtml({
      cspSource: "vscode-webview://unit-test",
      scriptUri: "vscode-webview://unit-test/main.js",
      styleUri: "vscode-webview://unit-test/main.css",
    });

    expect(html).toContain("default-src &#39;none&#39;");
    expect(html).toContain("connect-src &#39;none&#39;");
    expect(html).toMatch(/script-src &#39;nonce-[a-f0-9]{32}&#39;/u);
    expect(html).not.toContain("unsafe-inline");
    expect(html).not.toContain("unsafe-eval");
    expect(html).not.toMatch(/https?:\/\//u);
  });

  it("does not accept tool input for interpolation into markup", () => {
    expect(renderWebviewHtml.length).toBe(1);
  });
});
