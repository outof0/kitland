import type { Base64Mode, ToolResult } from "@kitland/core";
import type { ToolMountContext } from "../../registry";
import "./styles.css";
import {
  SAMPLE_INPUT,
  canTransferResult,
  decodeUtf8File,
  formatBytes,
  formatCount,
  inputCharacterLimit,
  inputFileByteLimit,
  type Base64Format,
} from "./domain";
import { isTransformResponse, type TransformRequest } from "./worker-protocol";
import { BASE64_TEMPLATE } from "./template";

export function mountTool({ root }: ToolMountContext): () => void {
  root.innerHTML = BASE64_TEMPLATE;
  const lifecycle = new AbortController();

  const TRANSFORM_DEBOUNCE_MS = 90;
  const ANNOUNCEMENT_RESET_MS = 1_200;

  type TransformSnapshot = {
    mode: Base64Mode;
    format: Base64Format;
    input: string;
    result: ToolResult<string>;
    outputByteLength: number;
  };

  type AppState = {
    mode: Base64Mode;
    format: Base64Format;
    input: string;
    output: string;
    outputByteLength: number;
    processing: boolean;
    error: string | null;
    completed: TransformSnapshot | null;
  };

  const elements = {
    input: element("#input-text", HTMLTextAreaElement),
    output: element("#output-text", HTMLTextAreaElement),
    inputLabel: element("#input-label", HTMLLabelElement),
    outputLabel: element("#output-label", HTMLLabelElement),
    inputMeta: element("#input-meta", HTMLElement),
    inputLimit: element("#input-limit", HTMLElement),
    outputMeta: element("#output-meta", HTMLElement),
    inputError: element("#input-error", HTMLParagraphElement),
    status: element("#tool-status", HTMLOutputElement),
    announcement: element("#announcement", HTMLOutputElement),
    fileInput: element("#file-input", HTMLInputElement),
    sampleButton: element("#sample-button", HTMLButtonElement),
    clearButton: element("#clear-button", HTMLButtonElement),
    uploadButton: element("#upload-button", HTMLButtonElement),
    copyInputButton: element("#copy-input-button", HTMLButtonElement),
    copyOutputButton: element("#copy-output-button", HTMLButtonElement),
    downloadButton: element("#download-button", HTMLButtonElement),
    swapButton: element("#swap-button", HTMLButtonElement),
    modeButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-mode]")),
    formatButtons: Array.from(root.querySelectorAll<HTMLButtonElement>("[data-format]")),
  };

  let state: AppState = {
    mode: "encode",
    format: "standard",
    input: SAMPLE_INPUT,
    output: "",
    outputByteLength: 0,
    processing: false,
    error: null,
    completed: null,
  };

  let worker: Worker | null = null;
  let requestSequence = 0;
  let activeRequestId = 0;
  let transformTimer: number | undefined;
  let announcementTimer: number | undefined;

  bindEvents();
  startWorker();
  elements.input.value = state.input;
  render();
  scheduleTransform();

  return () => {
    lifecycle.abort();
    stopWorker();
    if (announcementTimer !== undefined) window.clearTimeout(announcementTimer);
    root.replaceChildren();
  };

  function bindEvents(): void {
    elements.input.addEventListener("input", () => {
      state = { ...state, input: elements.input.value, error: null };
      scheduleTransform();
    });

    for (const button of elements.modeButtons) {
      button.addEventListener("click", () => {
        const nextMode = button.dataset.mode;
        if (nextMode === "encode" || nextMode === "decode") changeMode(nextMode);
      });
    }

    for (const button of elements.formatButtons) {
      button.addEventListener("click", () => {
        const nextFormat = button.dataset.format;
        if (nextFormat !== "standard" && nextFormat !== "url-safe") return;
        if (nextFormat === state.format) return;
        state = { ...state, format: nextFormat, error: null };
        scheduleTransform();
      });
    }

    elements.swapButton.addEventListener("click", () => {
      changeMode(state.mode === "encode" ? "decode" : "encode");
    });

    elements.sampleButton.addEventListener("click", () => {
      state = {
        ...state,
        mode: "encode",
        format: "standard",
        input: SAMPLE_INPUT,
        error: null,
      };
      elements.input.value = state.input;
      scheduleTransform();
      elements.input.focus();
    });

    elements.clearButton.addEventListener("click", () => {
      state = { ...state, input: "", error: null };
      elements.input.value = "";
      scheduleTransform();
      elements.input.focus();
    });

    elements.uploadButton.addEventListener("click", () => {
      elements.fileInput.value = "";
      elements.fileInput.click();
    });

    elements.fileInput.addEventListener("change", () => {
      const file = elements.fileInput.files?.[0];
      if (file) void loadFile(file);
    });

    elements.copyInputButton.addEventListener("click", () => {
      void copyToClipboard(state.input, "Input copied.");
    });

    elements.copyOutputButton.addEventListener("click", () => {
      void copyToClipboard(state.output, "Result copied.");
    });

    elements.downloadButton.addEventListener("click", downloadOutput);

    window.addEventListener("pagehide", stopWorker, { once: true, signal: lifecycle.signal });
  }

  function startWorker(): void {
    if (typeof Worker === "undefined") {
      failWorker("This browser could not start the local conversion worker.");
      return;
    }

    try {
      worker = new Worker(new URL("./base64.worker.ts", import.meta.url), { type: "module" });
    } catch {
      failWorker("This browser could not start the local conversion worker.");
      return;
    }

    worker.addEventListener("message", (event: MessageEvent<unknown>) => {
      if (!isTransformResponse(event.data)) {
        failWorker("The local conversion worker returned an invalid result.");
        return;
      }
      if (event.data.id !== activeRequestId) return;

      const result = event.data.result;
      const output = result.ok ? result.value : "";
      state = {
        ...state,
        output,
        outputByteLength: event.data.outputByteLength,
        processing: false,
        error: result.ok ? null : result.error.message,
        completed: {
          mode: state.mode,
          format: state.format,
          input: state.input,
          result,
          outputByteLength: event.data.outputByteLength,
        },
      };
      render();
    });

    worker.addEventListener("error", () => {
      failWorker("The local conversion worker stopped. Reopen the extension and try again.");
    });
    worker.addEventListener("messageerror", () => {
      failWorker("The local conversion worker could not read the result.");
    });
  }

  function stopWorker(): void {
    if (transformTimer !== undefined) window.clearTimeout(transformTimer);
    worker?.terminate();
    worker = null;
  }

  function scheduleTransform(): void {
    if (transformTimer !== undefined) {
      window.clearTimeout(transformTimer);
      transformTimer = undefined;
    }

    activeRequestId = ++requestSequence;
    const limit = inputCharacterLimit(state.mode);

    if (state.input.length === 0) {
      state = {
        ...state,
        output: "",
        outputByteLength: 0,
        processing: false,
        error: null,
        completed: null,
      };
      render();
      return;
    }

    if (state.input.length > limit) {
      state = {
        ...state,
        output: "",
        outputByteLength: 0,
        processing: false,
        error: `Input exceeds the ${formatCount(limit)} character limit.`,
        completed: null,
      };
      render();
      return;
    }

    if (!worker) {
      state = {
        ...state,
        output: "",
        outputByteLength: 0,
        processing: false,
        error: "The local conversion worker is unavailable. Reopen the extension and try again.",
        completed: null,
      };
      render();
      return;
    }

    state = {
      ...state,
      output: "",
      outputByteLength: 0,
      processing: true,
      error: null,
      completed: null,
    };
    render();

    const requestId = activeRequestId;
    transformTimer = window.setTimeout(() => {
      transformTimer = undefined;
      if (!worker || requestId !== activeRequestId) return;
      const request: TransformRequest = {
        type: "transform",
        id: requestId,
        mode: state.mode,
        format: state.format,
        input: state.input,
      };
      try {
        worker.postMessage(request);
      } catch {
        failWorker("The input could not be sent to the local conversion worker.");
      }
    }, TRANSFORM_DEBOUNCE_MS);
  }

  function changeMode(nextMode: Base64Mode): void {
    if (nextMode === state.mode || state.processing) return;

    const completed = currentCompletedTransform();
    if (completed?.result.ok && completed.result.value.length > 0) {
      if (!canTransferResult(nextMode, completed.result.value)) {
        announce(
          `Kept ${state.mode === "encode" ? "Encode" : "Decode"} selected. The result is too large for the target input.`,
        );
        return;
      }
      state = { ...state, mode: nextMode, input: completed.result.value, error: null };
      elements.input.value = state.input;
    } else {
      state = { ...state, mode: nextMode, error: null };
    }

    scheduleTransform();
  }

  function currentCompletedTransform(): TransformSnapshot | null {
    const completed = state.completed;
    if (
      !completed ||
      completed.mode !== state.mode ||
      completed.format !== state.format ||
      completed.input !== state.input
    ) {
      return null;
    }
    return completed;
  }

  async function loadFile(file: File): Promise<void> {
    const byteLimit = inputFileByteLimit(state.mode);
    if (file.size > byteLimit) {
      state = {
        ...state,
        error: `This file is larger than the ${formatBytes(byteLimit)} input limit.`,
      };
      render();
      elements.uploadButton.focus();
      return;
    }

    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    } catch {
      state = { ...state, error: "This file could not be read. Choose another UTF-8 text file." };
      render();
      elements.uploadButton.focus();
      return;
    }

    const decoded = decodeUtf8File(buffer);
    if (!decoded.ok) {
      state = { ...state, error: decoded.error.message };
      render();
      elements.uploadButton.focus();
      return;
    }

    const characterLimit = inputCharacterLimit(state.mode);
    if (decoded.value.length > characterLimit) {
      state = {
        ...state,
        error: `This file exceeds the ${formatCount(characterLimit)} character input limit.`,
      };
      render();
      elements.uploadButton.focus();
      return;
    }

    state = { ...state, input: decoded.value, error: null };
    elements.input.value = state.input;
    scheduleTransform();
    elements.input.focus();
  }

  async function copyToClipboard(text: string, successMessage: string): Promise<void> {
    if (!text) {
      announce("There is no text to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      announce(successMessage);
      return;
    } catch {
      // Permission-free extension pages may not expose Clipboard in every browser.
    }

    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.readOnly = true;
    fallback.className = "sr-only";
    document.body.appendChild(fallback);
    fallback.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    } finally {
      fallback.remove();
    }
    announce(
      copied
        ? successMessage
        : "Clipboard access is unavailable. Select and copy the text manually.",
    );
  }

  function downloadOutput(): void {
    if (!state.output) {
      announce("Create a valid result before downloading.");
      return;
    }

    const fileName =
      state.mode === "decode"
        ? "decoded.txt"
        : state.format === "url-safe"
          ? "encoded.base64url.txt"
          : "encoded.base64.txt";
    const url = URL.createObjectURL(new Blob([state.output], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    announce("Result download started.");
  }

  function failWorker(message: string): void {
    stopWorker();
    state = {
      ...state,
      output: "",
      outputByteLength: 0,
      processing: false,
      error: message,
      completed: null,
    };
    render();
  }

  function render(): void {
    const isUrlSafe = state.format === "url-safe";
    const formatLabel = isUrlSafe ? "Base64URL" : "Standard Base64";
    const inputLabel = state.mode === "encode" ? "UTF-8 text input" : `${formatLabel} input`;
    const outputLabel = state.mode === "encode" ? `${formatLabel} result` : "UTF-8 text result";
    const limit = inputCharacterLimit(state.mode);
    const hasOutput = state.output.length > 0 && !state.processing && !state.error;

    elements.inputLabel.textContent = inputLabel;
    elements.outputLabel.textContent = outputLabel;
    elements.input.placeholder =
      state.mode === "encode" ? "Paste UTF-8 text to encode…" : `Paste ${formatLabel} to decode…`;
    elements.output.placeholder = state.processing ? "Processing locally…" : "Result appears here…";
    elements.output.value = state.output;
    elements.inputMeta.textContent = `${formatCount(state.input.length)} chars`;
    elements.inputLimit.textContent = `limit ${formatCount(limit)}`;
    elements.outputMeta.textContent = `${formatCount(state.output.length)} chars · ${formatBytes(
      state.outputByteLength,
    )}`;

    elements.inputError.hidden = state.error === null;
    elements.inputError.textContent = state.error ?? "";
    elements.input.setAttribute("aria-invalid", state.error ? "true" : "false");

    elements.clearButton.disabled = state.input.length === 0;
    elements.copyInputButton.disabled = state.input.length === 0;
    elements.copyOutputButton.disabled = !hasOutput;
    elements.downloadButton.disabled = !hasOutput;
    elements.swapButton.disabled = state.processing || !hasOutput;

    for (const button of elements.modeButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode));
      button.disabled = state.processing;
    }
    for (const button of elements.formatButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.format === state.format));
    }

    const statusText =
      state.input.length === 0
        ? "Ready"
        : state.error
          ? "Needs attention"
          : state.processing
            ? "Processing locally…"
            : state.mode === "encode"
              ? "Encoded"
              : "Decoded";
    elements.status.textContent = statusText;
    elements.status.dataset.state = state.error
      ? "error"
      : state.processing
        ? "processing"
        : "success";
  }

  function announce(message: string): void {
    if (announcementTimer !== undefined) window.clearTimeout(announcementTimer);
    elements.announcement.textContent = message;
    announcementTimer = window.setTimeout(() => {
      elements.announcement.textContent = "";
      announcementTimer = undefined;
    }, ANNOUNCEMENT_RESET_MS);
  }

  function element<T extends Element>(selector: string, constructor: { new (): T }): T {
    const found = root.querySelector(selector);
    if (!(found instanceof constructor)) {
      throw new Error(`Missing required popup element: ${selector}`);
    }
    return found;
  }
}
