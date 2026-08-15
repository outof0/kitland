import { parseHostMessage, type WebviewMessage } from "../protocol";
import type { JsonInspection } from "@kitland/core";
import type { ToolChoice, ToolDescriptor, ToolOperation } from "../toolAdapter";

type VsCodeApi = { postMessage(message: WebviewMessage): void };
declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();
const form = requireElement<HTMLFormElement>("transform-form");
const title = requireElement<HTMLElement>("tool-title");
const description = requireElement<HTMLElement>("tool-description");
const operationFieldset = requireElement<HTMLFieldSetElement>("operation-fieldset");
const operationOptions = requireElement<HTMLElement>("operation-options");
const toolOptions = requireElement<HTMLElement>("tool-options");
const toolOptionsFieldset = requireElement<HTMLFieldSetElement>("tool-options-fieldset");
const toolOptionsLabel = requireElement<HTMLElement>("tool-options-label");
const input = requireElement<HTMLTextAreaElement>("input");
const output = requireElement<HTMLTextAreaElement>("output");
const outputLabel = requireElement<HTMLElement>("output-label");
const inputCount = requireElement<HTMLElement>("input-count");
const outputCount = requireElement<HTMLElement>("output-count");
const actionButton = requireElement<HTMLButtonElement>("transform");
const clearButton = requireElement<HTMLButtonElement>("clear");
const copyButton = requireElement<HTMLButtonElement>("copy");
const status = requireElement<HTMLElement>("privacy-status");
const inspectionSummary = requireElement<HTMLElement>("inspection-summary");
const inspectionStats = requireElement<HTMLDListElement>("inspection-stats");

let currentTool: ToolDescriptor | undefined;
let inputLimits = new Map<string, number>();
let inspectInputLimit: number | undefined;
let sequence = 0;
let pendingExecutionId: number | undefined;
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
  status.dataset.tone = kind === "success" ? "ready" : kind === "error" ? "error" : "neutral";
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
    // Segmented pressed-control look, matching the web workspace control chips.
    label.className =
      "inline-flex min-h-[26px] cursor-pointer items-center rounded-md border border-transparent px-2.5 text-xs font-semibold text-on-muted transition-colors duration-100 select-none hover:text-on-surface has-[:checked]:border-outline-strong has-[:checked]:bg-primary-soft has-[:checked]:text-primary-strong has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary";
    label.append(radio, document.createTextNode(choice.label));
    container.append(label);
  }
}
function setBusy(busy: boolean): void {
  form.setAttribute("aria-busy", String(busy));
  actionButton.disabled = busy || !currentTool;
}
function updateActionLabel(): void {
  const renderer = currentTool?.renderer;
  if (!renderer) {
    actionButton.textContent = "Run";
  } else {
    const operation = renderer.operations.find(({ id }) => id === selectedValue("operation"));
    actionButton.textContent = operation?.actionLabel ?? "Run";
  }
}
function currentInputLimit(): number | undefined {
  const renderer = currentTool?.renderer;
  if (!renderer) return undefined;
  return renderer.kind === "text-inspect"
    ? inspectInputLimit
    : inputLimits.get(selectedValue("operation") ?? "");
}
function updateInputCount(): void {
  inputCount.textContent = `${input.value.length.toLocaleString()} UTF-16 code units`;
  const limit = currentInputLimit();
  input.setAttribute("aria-invalid", String(limit !== undefined && input.value.length > limit));
  if (limit !== undefined && input.value.length > limit) {
    announce(`Input exceeds the ${limit.toLocaleString()} UTF-16 code unit limit.`, "error");
  }
}
function clearOutput(): void {
  output.value = "";
  outputCount.textContent = "0 UTF-16 code units";
  copyButton.disabled = true;
  pendingCopyId = undefined;
  inspectionSummary.hidden = true;
  inspectionStats.replaceChildren();
}
function clearHostOutput(): void {
  if (currentTool) vscode.postMessage({ type: "clear", toolId: currentTool.id });
}
function resetOutput(): void {
  pendingExecutionId = undefined;
  clearOutput();
  clearHostOutput();
  setBusy(false);
  updateActionLabel();
  updateInputCount();
  if (!(currentInputLimit() !== undefined && input.value.length > (currentInputLimit() ?? 0))) {
    announce("Ready. Nothing leaves your device.");
  }
}

function initializeTool(
  message: Extract<ReturnType<typeof parseHostMessage>, { type: "init" }>,
): void {
  if (!message) return;
  currentTool = message.tool;
  title.textContent = message.tool.title;
  description.textContent = message.tool.description;
  const renderer = message.tool.renderer;
  inputLimits = new Map();
  inspectInputLimit = undefined;
  if (renderer.kind === "text-transform" && "inputs" in message.limits) {
    inputLimits = new Map(
      message.limits.inputs.map((limit) => [limit.operationId, limit.maxInputChars]),
    );
    operationFieldset.hidden = false;
    renderChoices(operationOptions, "operation", renderer.operations, renderer.defaultOperationId);
    outputLabel.textContent = "Output";
  } else if (renderer.kind === "text-inspect" && "maxInputChars" in message.limits) {
    inspectInputLimit = message.limits.maxInputChars;
    operationFieldset.hidden = renderer.operations.length <= 1;
    renderChoices(operationOptions, "operation", renderer.operations, renderer.defaultOperationId);
    outputLabel.textContent = "Formatted JSON";
  } else return;
  toolOptionsLabel.textContent = renderer.optionLabel;
  renderChoices(toolOptions, "tool-option", renderer.options, renderer.defaultOptionId);
  toolOptionsFieldset.hidden = renderer.options.length === 1;
  input.value = message.input;
  pendingExecutionId = undefined;
  clearOutput();
  setBusy(false);
  updateActionLabel();
  updateInputCount();
  announce("Ready. Nothing leaves your device.");
  input.focus();
}

function requestExecution(): void {
  const tool = currentTool;
  const optionId = selectedValue("tool-option");
  const operationId = selectedValue("operation");
  if (!tool || !optionId || !operationId) {
    announce("The selected tool is not ready.", "error");
    return;
  }
  const limit = currentInputLimit();
  if (limit === undefined || input.value.length > limit) {
    announce(
      limit === undefined
        ? "The selected action is unavailable."
        : `Input exceeds the ${limit.toLocaleString()} UTF-16 code unit limit.`,
      "error",
    );
    return;
  }
  const requestId = nextRequestId();
  pendingExecutionId = requestId;
  clearOutput();
  setBusy(true);
  if (tool.renderer.kind === "text-inspect") {
    announce("Processing JSON locally…");
    vscode.postMessage({
      type: "inspect",
      requestId,
      toolId: tool.id,
      operationId,
      optionId,
      input: input.value,
    });
    return;
  }
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
  requestExecution();
});
input.addEventListener("input", resetOutput);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    requestExecution();
  }
});
clearButton.addEventListener("click", () => {
  input.value = "";
  resetOutput();
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
  if (message.type === "transformResult" || message.type === "inspectResult") {
    if (message.requestId !== pendingExecutionId) return;
    pendingExecutionId = undefined;
    setBusy(false);
    if (!message.ok) {
      clearOutput();
      announce(message.message, "error");
      return;
    }
    if (message.type === "transformResult") {
      output.value = message.value;
      outputCount.textContent = `${message.value.length.toLocaleString()} UTF-16 code units`;
      announce("Transformation completed locally.", "success");
    } else {
      output.value = message.inspection.formatted;
      outputCount.textContent = `${message.inspection.formatted.length.toLocaleString()} UTF-16 code units`;
      renderInspection(message.inspection);
      announce("JSON output completed locally.", "success");
    }
    copyButton.disabled = false;
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

function renderInspection(value: JsonInspection): void {
  inspectionStats.replaceChildren();
  const values: ReadonlyArray<readonly [string, string | number]> = [
    ["Root", value.rootType],
    ["Values", value.totalValues],
    ["Objects", value.objectCount],
    ["Arrays", value.arrayCount],
    ["Strings", value.stringCount],
    ["Numbers", value.numberCount],
    ["Booleans", value.booleanCount],
    ["Nulls", value.nullCount],
    ["Max depth", value.maxDepth],
  ];
  for (const [label, itemValue] of values) {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    wrapper.className = "min-w-0";
    term.className = "m-0 font-semibold text-on-muted";
    detail.className = "m-0 font-mono";
    term.textContent = label;
    detail.textContent = typeof itemValue === "number" ? itemValue.toLocaleString() : itemValue;
    wrapper.append(term, detail);
    inspectionStats.append(wrapper);
  }
  inspectionSummary.hidden = false;
}

vscode.postMessage({ type: "ready" });
