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
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${escapeAttribute(csp)}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kitland Developer Tools</title>
    <link rel="stylesheet" href="${escapeAttribute(options.styleUri)}">
  </head>
  <body>
    <main class="shell">
      <header class="hero">
        <p class="eyebrow">Kitland · Local developer tool</p>
        <h1 id="tool-title">Developer Tools</h1>
        <p id="tool-description" class="lede">Choose a Kitland tool from the Command Palette.</p>
      </header>

      <aside class="privacy" aria-label="Privacy information">
        <strong>Private by design.</strong>
        Text is processed locally in this extension. It is never logged, stored, telemetered, or sent
        over the network. Closing this panel clears its contents.
      </aside>

      <form id="transform-form" novalidate aria-busy="false">
        <div class="options">
          <fieldset>
            <legend>Operation</legend>
            <div id="operation-options" class="choice-list"></div>
          </fieldset>
          <fieldset id="tool-options-fieldset">
            <legend id="tool-options-label">Options</legend>
            <div id="tool-options" class="choice-list"></div>
          </fieldset>
        </div>

        <section class="field">
          <div class="field-heading">
            <label for="input">Input</label>
            <span id="input-count" aria-live="polite">0 characters</span>
          </div>
          <textarea id="input" rows="10" spellcheck="false" autocomplete="off"
            aria-describedby="input-help privacy-status"></textarea>
          <p id="input-help" class="hint">Press Ctrl+Enter or Cmd+Enter to transform.</p>
        </section>

        <div class="actions">
          <button id="transform" class="primary" type="submit" disabled>Transform</button>
          <button id="clear" type="button">Clear</button>
        </div>

        <section class="field">
          <div class="field-heading">
            <label for="output">Output</label>
            <span id="output-count">0 characters</span>
          </div>
          <textarea id="output" rows="10" spellcheck="false" readonly
            aria-describedby="output-help privacy-status"></textarea>
          <div class="output-footer">
            <p id="output-help" class="hint">Output is only copied after you press Copy.</p>
            <button id="copy" type="button" disabled>Copy output</button>
          </div>
        </section>
      </form>

      <p id="privacy-status" class="status" role="status" aria-live="polite" aria-atomic="true">
        Loading local tool…
      </p>
    </main>
    <script nonce="${escapeAttribute(nonce)}" src="${escapeAttribute(options.scriptUri)}"></script>
  </body>
</html>`;
}
