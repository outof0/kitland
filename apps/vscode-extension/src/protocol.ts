import {
  PROTOCOL_MAX_CATALOG_CHOICES,
  PROTOCOL_MAX_DESCRIPTION_CHARS,
  PROTOCOL_MAX_ID_CHARS,
  PROTOCOL_MAX_LABEL_CHARS,
  PROTOCOL_MAX_TEXT_CHARS,
} from "./constants";
import type { ToolChoice, ToolDescriptor, ToolOperation } from "./toolAdapter";

export type WebviewMessage =
  | { type: "ready" }
  | { type: "clear"; toolId: string }
  | {
      type: "transform";
      requestId: number;
      toolId: string;
      operationId: string;
      optionId: string;
      input: string;
    }
  | { type: "copy"; requestId: number; toolId: string };

export type ToolInputLimit = {
  operationId: string;
  maxInputChars: number;
};

export type HostMessage =
  | {
      type: "init";
      tool: ToolDescriptor;
      input: string;
      limits: {
        inputs: readonly ToolInputLimit[];
        maxOutputChars: number;
      };
    }
  | {
      type: "transformResult";
      requestId: number;
      toolId: string;
      ok: true;
      value: string;
    }
  | {
      type: "transformResult";
      requestId: number;
      toolId: string;
      ok: false;
      code: string;
      message: string;
    }
  | { type: "copyResult"; requestId: number; toolId: string; ok: true }
  | { type: "copyResult"; requestId: number; toolId: string; ok: false; message: string };

type UnknownRecord = Record<string, unknown>;

function exactRecord(value: unknown, keys: readonly string[]): UnknownRecord | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;

  const record = value as UnknownRecord;
  const actualKeys = Object.keys(record);
  if (
    actualKeys.length !== keys.length ||
    keys.some((key) => !Object.prototype.hasOwnProperty.call(record, key))
  ) {
    return undefined;
  }
  return record;
}

function isRequestId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveSafeInteger(value: unknown, maximum: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= maximum;
}

function isBoundedString(value: unknown, maximum: number, allowEmpty = true): value is string {
  return typeof value === "string" && value.length <= maximum && (allowEmpty || value.length > 0);
}

function isId(value: unknown): value is string {
  return isBoundedString(value, PROTOCOL_MAX_ID_CHARS, false) && /^[a-z][a-z0-9-]*$/u.test(value);
}

function parseChoice(value: unknown): ToolChoice | undefined {
  const record = exactRecord(value, ["id", "label"]);
  if (
    !record ||
    !isId(record.id) ||
    !isBoundedString(record.label, PROTOCOL_MAX_LABEL_CHARS, false)
  ) {
    return undefined;
  }
  return { id: record.id, label: record.label };
}

function parseOperation(value: unknown): ToolOperation | undefined {
  const record = exactRecord(value, ["id", "label", "actionLabel"]);
  if (
    !record ||
    !isId(record.id) ||
    !isBoundedString(record.label, PROTOCOL_MAX_LABEL_CHARS, false) ||
    !isBoundedString(record.actionLabel, PROTOCOL_MAX_LABEL_CHARS, false)
  ) {
    return undefined;
  }
  return { id: record.id, label: record.label, actionLabel: record.actionLabel };
}

function parseChoiceArray<T>(
  value: unknown,
  parser: (entry: unknown) => T | undefined,
): T[] | undefined {
  if (!Array.isArray(value) || value.length === 0 || value.length > PROTOCOL_MAX_CATALOG_CHOICES) {
    return undefined;
  }
  const parsed: T[] = [];
  for (const entry of value) {
    const item = parser(entry);
    if (!item) return undefined;
    parsed.push(item);
  }
  return parsed;
}

function hasUniqueIds(values: readonly ToolChoice[]): boolean {
  return new Set(values.map((value) => value.id)).size === values.length;
}

function parseToolDescriptor(value: unknown): ToolDescriptor | undefined {
  const record = exactRecord(value, ["id", "title", "description", "renderer"]);
  const renderer = exactRecord(record?.renderer, [
    "kind",
    "operations",
    "options",
    "optionLabel",
    "defaultOperationId",
    "defaultOptionId",
  ]);
  const operations = parseChoiceArray(renderer?.operations, parseOperation);
  const options = parseChoiceArray(renderer?.options, parseChoice);
  if (
    !record ||
    !renderer ||
    !operations ||
    !options ||
    !isId(record.id) ||
    !isBoundedString(record.title, PROTOCOL_MAX_LABEL_CHARS, false) ||
    !isBoundedString(record.description, PROTOCOL_MAX_DESCRIPTION_CHARS, false) ||
    renderer.kind !== "text-transform" ||
    !isBoundedString(renderer.optionLabel, PROTOCOL_MAX_LABEL_CHARS, false) ||
    !isId(renderer.defaultOperationId) ||
    !isId(renderer.defaultOptionId) ||
    !hasUniqueIds(operations) ||
    !hasUniqueIds(options) ||
    !operations.some((operation) => operation.id === renderer.defaultOperationId) ||
    !options.some((option) => option.id === renderer.defaultOptionId)
  ) {
    return undefined;
  }

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    renderer: {
      kind: "text-transform",
      operations,
      options,
      optionLabel: renderer.optionLabel,
      defaultOperationId: renderer.defaultOperationId,
      defaultOptionId: renderer.defaultOptionId,
    },
  };
}

function parseInputLimits(value: unknown): ToolInputLimit[] | undefined {
  if (!Array.isArray(value) || value.length === 0 || value.length > PROTOCOL_MAX_CATALOG_CHOICES) {
    return undefined;
  }
  const limits: ToolInputLimit[] = [];
  for (const entry of value) {
    const record = exactRecord(entry, ["operationId", "maxInputChars"]);
    if (
      !record ||
      !isId(record.operationId) ||
      !isPositiveSafeInteger(record.maxInputChars, PROTOCOL_MAX_TEXT_CHARS)
    ) {
      return undefined;
    }
    limits.push({ operationId: record.operationId, maxInputChars: record.maxInputChars });
  }
  if (new Set(limits.map((limit) => limit.operationId)).size !== limits.length) return undefined;
  return limits;
}

export function parseWebviewMessage(value: unknown): WebviewMessage | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const type = (value as UnknownRecord).type;

  if (type === "ready") {
    return exactRecord(value, ["type"]) ? { type: "ready" } : undefined;
  }

  if (type === "copy") {
    const record = exactRecord(value, ["type", "requestId", "toolId"]);
    if (!record || !isRequestId(record.requestId) || !isId(record.toolId)) return undefined;
    return { type: "copy", requestId: record.requestId, toolId: record.toolId };
  }

  if (type === "clear") {
    const record = exactRecord(value, ["type", "toolId"]);
    if (!record || !isId(record.toolId)) return undefined;
    return { type: "clear", toolId: record.toolId };
  }

  if (type === "transform") {
    const record = exactRecord(value, [
      "type",
      "requestId",
      "toolId",
      "operationId",
      "optionId",
      "input",
    ]);
    if (
      !record ||
      !isRequestId(record.requestId) ||
      !isId(record.toolId) ||
      !isId(record.operationId) ||
      !isId(record.optionId) ||
      !isBoundedString(record.input, PROTOCOL_MAX_TEXT_CHARS)
    ) {
      return undefined;
    }
    return {
      type: "transform",
      requestId: record.requestId,
      toolId: record.toolId,
      operationId: record.operationId,
      optionId: record.optionId,
      input: record.input,
    };
  }

  return undefined;
}

export function parseHostMessage(value: unknown): HostMessage | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const type = (value as UnknownRecord).type;

  if (type === "init") {
    const record = exactRecord(value, ["type", "tool", "input", "limits"]);
    const tool = parseToolDescriptor(record?.tool);
    const limitsRecord = exactRecord(record?.limits, ["inputs", "maxOutputChars"]);
    const inputs = parseInputLimits(limitsRecord?.inputs);
    if (
      !record ||
      !tool ||
      !limitsRecord ||
      !inputs ||
      !isBoundedString(record.input, PROTOCOL_MAX_TEXT_CHARS) ||
      !isPositiveSafeInteger(limitsRecord.maxOutputChars, PROTOCOL_MAX_TEXT_CHARS) ||
      inputs.length !== tool.renderer.operations.length ||
      !tool.renderer.operations.every((operation) =>
        inputs.some((limit) => limit.operationId === operation.id),
      )
    ) {
      return undefined;
    }
    return {
      type: "init",
      tool,
      input: record.input,
      limits: { inputs, maxOutputChars: limitsRecord.maxOutputChars },
    };
  }

  if (type === "transformResult") {
    const candidate = value as UnknownRecord;
    if (candidate.ok === true) {
      const record = exactRecord(value, ["type", "requestId", "toolId", "ok", "value"]);
      if (
        !record ||
        !isRequestId(record.requestId) ||
        !isId(record.toolId) ||
        !isBoundedString(record.value, PROTOCOL_MAX_TEXT_CHARS)
      ) {
        return undefined;
      }
      return {
        type: "transformResult",
        requestId: record.requestId,
        toolId: record.toolId,
        ok: true,
        value: record.value,
      };
    }
    if (candidate.ok === false) {
      const record = exactRecord(value, ["type", "requestId", "toolId", "ok", "code", "message"]);
      if (
        !record ||
        !isRequestId(record.requestId) ||
        !isId(record.toolId) ||
        !isBoundedString(record.code, PROTOCOL_MAX_ID_CHARS, false) ||
        !isBoundedString(record.message, PROTOCOL_MAX_DESCRIPTION_CHARS, false)
      ) {
        return undefined;
      }
      return {
        type: "transformResult",
        requestId: record.requestId,
        toolId: record.toolId,
        ok: false,
        code: record.code,
        message: record.message,
      };
    }
    return undefined;
  }

  if (type === "copyResult") {
    const candidate = value as UnknownRecord;
    if (candidate.ok === true) {
      const record = exactRecord(value, ["type", "requestId", "toolId", "ok"]);
      if (!record || !isRequestId(record.requestId) || !isId(record.toolId)) return undefined;
      return {
        type: "copyResult",
        requestId: record.requestId,
        toolId: record.toolId,
        ok: true,
      };
    }
    if (candidate.ok === false) {
      const record = exactRecord(value, ["type", "requestId", "toolId", "ok", "message"]);
      if (
        !record ||
        !isRequestId(record.requestId) ||
        !isId(record.toolId) ||
        !isBoundedString(record.message, PROTOCOL_MAX_DESCRIPTION_CHARS, false)
      ) {
        return undefined;
      }
      return {
        type: "copyResult",
        requestId: record.requestId,
        toolId: record.toolId,
        ok: false,
        message: record.message,
      };
    }
  }

  return undefined;
}
