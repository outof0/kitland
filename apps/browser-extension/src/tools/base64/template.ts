export const BASE64_TEMPLATE = `
  <div class="base64-tool">
    <section class="tool-heading" aria-labelledby="tool-title">
      <div>
        <p class="eyebrow">REFERENCE ADAPTER · ENCODING</p>
        <h2 id="tool-title">Base64</h2>
        <p>Encode UTF-8 text or decode Base64 without sending it anywhere.</p>
      </div>
      <button id="sample-button" class="button button-quiet" type="button">Sample</button>
    </section>

    <div class="controls-row">
      <fieldset class="segmented" id="mode-control">
        <legend>Direction</legend>
        <div>
          <button type="button" data-mode="encode" aria-pressed="true">Encode</button>
          <button type="button" data-mode="decode" aria-pressed="false">Decode</button>
        </div>
      </fieldset>

      <fieldset class="segmented" id="format-control">
        <legend>Format</legend>
        <div>
          <button type="button" data-format="standard" aria-pressed="true">Standard</button>
          <button type="button" data-format="url-safe" aria-pressed="false">Base64URL</button>
        </div>
      </fieldset>
    </div>

    <section class="editor-card" aria-labelledby="input-label">
      <div class="editor-header">
        <div>
          <span class="status-dot status-dot-input" aria-hidden="true"></span>
          <label id="input-label" for="input-text">UTF-8 text input</label>
        </div>
        <div class="editor-actions">
          <button id="copy-input-button" class="icon-button" type="button" title="Copy input">
            <span aria-hidden="true">⧉</span><span class="sr-only">Copy input</span>
          </button>
          <button id="upload-button" class="icon-button" type="button" title="Open a UTF-8 text file">
            <span aria-hidden="true">↑</span><span class="sr-only">Open a UTF-8 text file</span>
          </button>
          <button id="clear-button" class="icon-button" type="button" title="Clear input">
            <span aria-hidden="true">×</span><span class="sr-only">Clear input</span>
          </button>
        </div>
      </div>
      <textarea id="input-text" rows="6" spellcheck="false" aria-describedby="input-meta input-error"></textarea>
      <div class="editor-footer">
        <span id="input-meta">0 chars</span>
        <span id="input-limit"></span>
      </div>
      <p id="input-error" class="message message-error" role="alert" hidden></p>
    </section>

    <div class="swap-row">
      <span aria-hidden="true"></span>
      <button id="swap-button" class="swap-button" type="button" title="Use the result as input and switch direction">
        <span aria-hidden="true">⇄</span>
        <span>Use result &amp; switch</span>
      </button>
      <span aria-hidden="true"></span>
    </div>

    <section class="editor-card editor-card-output" aria-labelledby="output-label">
      <div class="editor-header">
        <div>
          <span class="status-dot status-dot-output" aria-hidden="true"></span>
          <label id="output-label" for="output-text">Standard Base64 result</label>
        </div>
        <div class="editor-actions">
          <button id="copy-output-button" class="icon-button" type="button" title="Copy result">
            <span aria-hidden="true">⧉</span><span class="sr-only">Copy result</span>
          </button>
          <button id="download-button" class="icon-button" type="button" title="Download result">
            <span aria-hidden="true">↓</span><span class="sr-only">Download result</span>
          </button>
        </div>
      </div>
      <textarea id="output-text" rows="5" readonly spellcheck="false" aria-describedby="output-meta"></textarea>
      <div class="editor-footer">
        <span>Read-only</span>
        <span id="output-meta">0 chars · 0 B</span>
      </div>
    </section>

    <footer class="tool-footer">
      <output id="tool-status" class="tool-status" aria-live="polite">Ready</output>
      <span>Runs only on this device</span>
    </footer>
    <output id="announcement" class="sr-only" aria-live="polite" aria-atomic="true"></output>
    <input id="file-input" class="sr-only" type="file" accept="text/*,.txt,.text,.b64,.base64,.json,.csv,.md,.xml" />
  </div>
`;
