import "./styles.css";
import { parseHostMessage, type WebviewMessage } from "../protocol";
import type { ToolChoice, ToolDescriptor, ToolOperation } from "../toolAdapter";

type VsCodeApi = {
  postMessage(message: WebviewMessage): void;
};

declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();
const form = requireElement<HTMLFormElement>("transform-form");
const title = requireElement<HTMLElement>("tool-title");
const description = requireElement<HTMLElement>("tool-description");
const operationOptions = requireElement<HTMLElement>("operation-options");
const toolOptions = requireElement<HTMLElement>("tool-options");
const toolOptionsFieldset = requireElement<HTMLFieldSetElement>("tool-options-fieldset");
const toolOptionsLabel = requireElement<HTMLElement>("tool-options-label");
const input = requireElement<HTMLTextAreaElement>("input");
const output = requireElement<HTMLTextAreaElement>("output");
const inputCount = requireElement<HTMLElement>("input-count");
const outputCount = requireElement<HTMLElement>("output-count");
const transformButton = requireElement<HTMLButtonElement>("transform");
const clearButton = requireElement<HTMLButtonElement>("clear");
const copyButton = requireElement<HTMLButtonElement>("copy");
const status = requireElement<HTMLElement>("privacy-status");

let currentTool: ToolDescriptor | undefined;
let inputLimits = new Map<string, number>();
let sequence = 0;
let pendingTransformId: number | undefined;
let pendingCopyId: number | undefined;

function requireElement<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing required element: ${id}`);
  return value as T;
}

function nextRequestId(): number {
  sequence = sequence === Number.MAX_SAFE_INTEGER ? 1 : sequence + 1;
  return sequence;
}

function announce(message: string, kind: "normal" | "success" | "error" = "normal"): void {
  status.textContent = message;
  status.dataset.kind = kind;
}

function selectedValue(name: string): string | undefined {
  return document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value;
}

function renderChoices(
  container: HTMLElement,
  name: string,
  choices: readonly (ToolChoice | ToolOperation)[],
  selectedId: string,
): void {
  container.replaceChildren();
  for (const choice of choices) {
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = name;
    radio.value = choice.id;
    radio.id = `${name}-${choice.id}`;
    radio.checked = choice.id === selectedId;
    radio.addEventListener("change", resetOutput);

    const label = document.createElement("label");
    label.htmlFor = radio.id;
    label.append(radio, document.createTextNode(choice.label));
    container.append(label);
  }
}

function setBusy(busy: boolean): void {
  form.setAttribute("aria-busy", String(busy));
  transformButton.disabled = busy || !currentTool;
}

function updateActionLabel(): void {
  const operationId = selectedValue("operation");
  const operation = currentTool?.renderer.operations.find((entry) => entry.id === operationId);
  transformButton.textContent = operation?.actionLabel ?? "Transform";
}

function updateInputCount(): void {
  inputCount.textContent = `${input.value.length.toLocaleString()} characters`;
  const operationId = selectedValue("operation");
  const limit = operationId ? inputLimits.get(operationId) : undefined;
  if (limit !== undefined && input.value.length > limit) {
    announce(`Input exceeds this operation's ${limit.toLocaleString()} character limit.`, "error");
  }
}

function clearOutput(): void {
  output.value = "";
  outputCount.textContent = "0 characters";
  copyButton.disabled = true;
  pendingCopyId = undefined;
}

function clearHostOutput(): void {
  if (currentTool) vscode.postMessage({ type: "clear", toolId: currentTool.id });
}

function resetOutput(): void {
  pendingTransformId = undefined;
  clearOutput();
  clearHostOutput();
  setBusy(false);
  updateActionLabel();
  updateInputCount();
  announce("Ready. Nothing leaves your device.");
}

function initializeTool(
  message: Extract<ReturnType<typeof parseHostMessage>, { type: "init" }>,
): void {
  if (!message) return;
  currentTool = message.tool;
  inputLimits = new Map(
    message.limits.inputs.map((limit) => [limit.operationId, limit.maxInputChars]),
  );
  title.textContent = message.tool.title;
  description.textContent = message.tool.description;
  toolOptionsLabel.textContent = message.tool.renderer.optionLabel;
  renderChoices(
    operationOptions,
    "operation",
    message.tool.renderer.operations,
    message.tool.renderer.defaultOperationId,
  );
  renderChoices(
    toolOptions,
    "tool-option",
    message.tool.renderer.options,
    message.tool.renderer.defaultOptionId,
  );
  toolOptionsFieldset.hidden = message.tool.renderer.options.length === 1;
  input.value = message.input;
  pendingTransformId = undefined;
  clearOutput();
  setBusy(false);
  updateActionLabel();
  updateInputCount();
  announce("Ready. Nothing leaves your device.");
  input.focus();
}

function requestTransform(): void {
  const tool = currentTool;
  const operationId = selectedValue("operation");
  const optionId = selectedValue("tool-option");
  if (!tool || !operationId || !optionId) {
    announce("The selected tool is not ready.", "error");
    return;
  }
  const limit = inputLimits.get(operationId);
  if (limit === undefined || input.value.length > limit) {
    announce(
      limit === undefined
        ? "The selected operation is not available."
        : `Input exceeds this operation's ${limit.toLocaleString()} character limit.`,
      "error",
    );
    return;
  }

  const requestId = nextRequestId();
  pendingTransformId = requestId;
  clearOutput();
  setBusy(true);
  announce("Transforming locally…");
  vscode.postMessage({
    type: "transform",
    requestId,
    toolId: tool.id,
    operationId,
    optionId,
    input: input.value,
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  requestTransform();
});

input.addEventListener("input", updateInputCount);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    requestTransform();
  }
});

clearButton.addEventListener("click", () => {
  input.value = "";
  pendingTransformId = undefined;
  clearOutput();
  clearHostOutput();
  setBusy(false);
  updateInputCount();
  announce("Cleared. Nothing is retained by the extension.");
  input.focus();
});

copyButton.addEventListener("click", () => {
  const tool = currentTool;
  if (!tool || copyButton.disabled) return;
  const requestId = nextRequestId();
  pendingCopyId = requestId;
  copyButton.disabled = true;
  announce("Copying after your explicit request…");
  vscode.postMessage({ type: "copy", requestId, toolId: tool.id });
});

window.addEventListener("message", (event: MessageEvent<unknown>) => {
  const message = parseHostMessage(event.data);
  if (!message) return;

  if (message.type === "init") {
    initializeTool(message);
    return;
  }
  if (!currentTool || message.toolId !== currentTool.id) return;

  if (message.type === "transformResult") {
    if (message.requestId !== pendingTransformId) return;
    pendingTransformId = undefined;
    setBusy(false);
    if (!message.ok) {
      clearOutput();
      announce(message.message, "error");
      return;
    }
    output.value = message.value;
    outputCount.textContent = `${message.value.length.toLocaleString()} characters`;
    copyButton.disabled = false;
    announce("Transformation completed locally.", "success");
    return;
  }

  if (message.requestId !== pendingCopyId) return;
  pendingCopyId = undefined;
  copyButton.disabled = output.value.length === 0;
  announce(
    message.ok ? "Copied to the VS Code clipboard." : message.message,
    message.ok ? "success" : "error",
  );
});

vscode.postMessage({ type: "ready" });
