export type WebviewHtmlOptions = {
  cspSource: string;
  scriptUri: string;
  styleUri: string;
};

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createNonce(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * React workspace mount matching the web/extension WorkspaceShell.
 * Markup is only the root node; tool chrome is rendered by @kitland/ui.
 * No file-open controls. Strict CSP: stylesheet + nonce script only.
 */
export function renderWebviewHtml(options: WebviewHtmlOptions): string {
  const nonce = createNonce();
  const csp = [
    "default-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "connect-src 'none'",
    "font-src 'none'",
    "frame-src 'none'",
    "img-src 'none'",
    "media-src 'none'",
    "object-src 'none'",
    `style-src ${options.cspSource}`,
    `script-src 'nonce-${nonce}'`,
  ].join("; ");

  return `<!doctype html>
<html lang="en" data-theme="dark" class="min-h-full">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${escapeAttribute(csp)}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kitland Developer Tools</title>
    <link rel="stylesheet" href="${escapeAttribute(options.styleUri)}">
  </head>
  <body class="m-0 min-h-full bg-bg font-ui text-on-surface antialiased">
    <div id="root" class="min-h-dvh w-full"></div>
    <script nonce="${escapeAttribute(nonce)}" src="${escapeAttribute(options.scriptUri)}"></script>
  </body>
</html>`;
}
