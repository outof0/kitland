import {
  JSON_FORMATTER_MAX_DEPTH,
  JSON_FORMATTER_MAX_NODES,
  JSON_FORMATTER_MAX_OUTPUT_CHARS,
  REGEX_TEST_MAX_INPUT_CHARS,
  REGEX_TEST_MAX_PATTERN_CHARS,
  type JsonInspection,
  type RegexTestResult,
  type ToolResult,
} from "@kitland/core";
import {
  PROTOCOL_MAX_CATALOG_CHOICES,
  PROTOCOL_MAX_DESCRIPTION_CHARS,
  PROTOCOL_MAX_ID_CHARS,
  PROTOCOL_MAX_LABEL_CHARS,
  PROTOCOL_MAX_TEXT_CHARS,
} from "./constants";
import type {
  TextInspectRenderer,
  TextTransformRenderer,
  ToolChoice,
  ToolDescriptor,
  ToolOperation,
} from "./toolAdapter";

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
  | {
      type: "inspect";
      requestId: number;
      toolId: string;
      operationId: string;
      optionId: string;
      input: string;
    }
  | { type: "copy"; requestId: number; toolId: string }
  | { type: "listTools" }
  | { type: "selectTool"; toolId: string }
  | {
      type: "regexTest";
      requestId: number;
      pattern: string;
      input: string;
      flags: string;
    };

export type ToolInputLimit = { operationId: string; maxInputChars: number };

/** Serialized catalog entry sent to the webview for sidebar rendering. */
export type CatalogToolEntry = {
  id: string;
  slug: string;
  shortName: string;
  name: string;
  description: string;
  family: string;
};

export type HostMessage =
  | {
      type: "init";
      tool: ToolDescriptor & { renderer: TextTransformRenderer };
      input: string;
      limits: { inputs: readonly ToolInputLimit[]; maxOutputChars: number };
    }
  | {
      type: "init";
      tool: ToolDescriptor & { renderer: TextInspectRenderer };
      input: string;
      limits: { maxInputChars: number; maxOutputChars: number };
    }
  | { type: "transformResult"; requestId: number; toolId: string; ok: true; value: string }
  | {
      type: "transformResult";
      requestId: number;
      toolId: string;
      ok: false;
      code: string;
      message: string;
    }
  | {
      type: "inspectResult";
      requestId: number;
      toolId: string;
      ok: true;
      inspection: JsonInspection;
    }
  | {
      type: "inspectResult";
      requestId: number;
      toolId: string;
      ok: false;
      code: string;
      message: string;
    }
  | { type: "copyResult"; requestId: number; toolId: string; ok: true }
  | { type: "copyResult"; requestId: number; toolId: string; ok: false; message: string }
  | {
      type: "toolsList";
      tools: readonly CatalogToolEntry[];
      activeToolId: string;
      initialInput: string;
      collapseSidebar?: boolean;
    }
  | { type: "themeChanged"; kind: "light" | "dark" }
  | { type: "regexResult"; requestId: number; result: ToolResult<RegexTestResult> };

type UnknownRecord = Record<string, unknown>;

function exactRecord(value: unknown, keys: readonly string[]): UnknownRecord | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const record = value as UnknownRecord;
  const actual = Object.keys(record);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(record, key))
    ? record
    : undefined;
}
function isRequestId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function isPositiveSafeInteger(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= max;
}
function isNonNegativeBoundedSafeInteger(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= max;
}
function isBoundedString(value: unknown, maximum: number, allowEmpty = true): value is string {
  return typeof value === "string" && value.length <= maximum && (allowEmpty || value.length > 0);
}
function isId(value: unknown): value is string {
  return isBoundedString(value, PROTOCOL_MAX_ID_CHARS, false) && /^[a-z][a-z0-9-]*$/u.test(value);
}
function parseChoice(value: unknown): ToolChoice | undefined {
  const record = exactRecord(value, ["id", "label"]);
  return record && isId(record.id) && isBoundedString(record.label, PROTOCOL_MAX_LABEL_CHARS, false)
    ? { id: record.id, label: record.label }
    : undefined;
}
function parseOperation(value: unknown): ToolOperation | undefined {
  const record = exactRecord(value, ["id", "label", "actionLabel"]);
  return record &&
    isId(record.id) &&
    isBoundedString(record.label, PROTOCOL_MAX_LABEL_CHARS, false) &&
    isBoundedString(record.actionLabel, PROTOCOL_MAX_LABEL_CHARS, false)
    ? { id: record.id, label: record.label, actionLabel: record.actionLabel }
    : undefined;
}
function parseArray<T>(value: unknown, parser: (entry: unknown) => T | undefined): T[] | undefined {
  if (!Array.isArray(value) || value.length === 0 || value.length > PROTOCOL_MAX_CATALOG_CHOICES)
    return undefined;
  const result: T[] = [];
  for (const entry of value) {
    const parsed = parser(entry);
    if (!parsed) return undefined;
    result.push(parsed);
  }
  return result;
}
function unique(values: readonly ToolChoice[]): boolean {
  return new Set(values.map(({ id }) => id)).size === values.length;
}

function parseToolDescriptor(value: unknown): ToolDescriptor | undefined {
  const record = exactRecord(value, ["id", "title", "description", "renderer"]);
  if (
    !record ||
    !isId(record.id) ||
    !isBoundedString(record.title, PROTOCOL_MAX_LABEL_CHARS, false) ||
    !isBoundedString(record.description, PROTOCOL_MAX_DESCRIPTION_CHARS, false)
  )
    return undefined;
  const candidate = record.renderer as UnknownRecord | null;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return undefined;
  if (candidate.kind === "text-transform") {
    const renderer = exactRecord(candidate, [
      "kind",
      "operations",
      "options",
      "optionLabel",
      "defaultOperationId",
      "defaultOptionId",
    ]);
    const operations = parseArray(renderer?.operations, parseOperation);
    const options = parseArray(renderer?.options, parseChoice);
    if (
      !renderer ||
      !operations ||
      !options ||
      !isBoundedString(renderer.optionLabel, PROTOCOL_MAX_LABEL_CHARS, false) ||
      !isId(renderer.defaultOperationId) ||
      !isId(renderer.defaultOptionId) ||
      !unique(operations) ||
      !unique(options) ||
      !operations.some(({ id }) => id === renderer.defaultOperationId) ||
      !options.some(({ id }) => id === renderer.defaultOptionId)
    )
      return undefined;
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
  if (candidate.kind === "text-inspect") {
    const renderer = exactRecord(candidate, [
      "kind",
      "operations",
      "options",
      "optionLabel",
      "defaultOperationId",
      "defaultOptionId",
    ]);
    const operations = parseArray(renderer?.operations, parseOperation);
    const options = parseArray(renderer?.options, parseChoice);
    if (
      !renderer ||
      !operations ||
      !options ||
      !unique(operations) ||
      !unique(options) ||
      !isBoundedString(renderer.optionLabel, PROTOCOL_MAX_LABEL_CHARS, false) ||
      !isId(renderer.defaultOperationId) ||
      !isId(renderer.defaultOptionId) ||
      !operations.some(({ id }) => id === renderer.defaultOperationId) ||
      !options.some(({ id }) => id === renderer.defaultOptionId)
    )
      return undefined;
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      renderer: {
        kind: "text-inspect",
        operations,
        options,
        optionLabel: renderer.optionLabel,
        defaultOperationId: renderer.defaultOperationId,
        defaultOptionId: renderer.defaultOptionId,
      },
    };
  }
  return undefined;
}

function parseInputLimits(value: unknown): ToolInputLimit[] | undefined {
  if (!Array.isArray(value) || value.length === 0 || value.length > PROTOCOL_MAX_CATALOG_CHOICES)
    return undefined;
  const limits: ToolInputLimit[] = [];
  for (const entry of value) {
    const record = exactRecord(entry, ["operationId", "maxInputChars"]);
    if (
      !record ||
      !isId(record.operationId) ||
      !isPositiveSafeInteger(record.maxInputChars, PROTOCOL_MAX_TEXT_CHARS)
    )
      return undefined;
    limits.push({ operationId: record.operationId, maxInputChars: record.maxInputChars });
  }
  return new Set(limits.map(({ operationId }) => operationId)).size === limits.length
    ? limits
    : undefined;
}

export function parseWebviewMessage(value: unknown): WebviewMessage | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const type = (value as UnknownRecord).type;
  if (type === "ready") return exactRecord(value, ["type"]) ? { type: "ready" } : undefined;
  if (type === "clear") {
    const record = exactRecord(value, ["type", "toolId"]);
    return record && isId(record.toolId) ? { type: "clear", toolId: record.toolId } : undefined;
  }
  if (type === "copy") {
    const record = exactRecord(value, ["type", "requestId", "toolId"]);
    return record && isRequestId(record.requestId) && isId(record.toolId)
      ? { type: "copy", requestId: record.requestId, toolId: record.toolId }
      : undefined;
  }
  if (type === "inspect") {
    const record = exactRecord(value, [
      "type",
      "requestId",
      "toolId",
      "operationId",
      "optionId",
      "input",
    ]);
    return record &&
      isRequestId(record.requestId) &&
      isId(record.toolId) &&
      isId(record.operationId) &&
      isId(record.optionId) &&
      isBoundedString(record.input, PROTOCOL_MAX_TEXT_CHARS)
      ? {
          type: "inspect",
          requestId: record.requestId,
          toolId: record.toolId,
          operationId: record.operationId,
          optionId: record.optionId,
          input: record.input,
        }
      : undefined;
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
    return record &&
      isRequestId(record.requestId) &&
      isId(record.toolId) &&
      isId(record.operationId) &&
      isId(record.optionId) &&
      isBoundedString(record.input, PROTOCOL_MAX_TEXT_CHARS)
      ? {
          type: "transform",
          requestId: record.requestId,
          toolId: record.toolId,
          operationId: record.operationId,
          optionId: record.optionId,
          input: record.input,
        }
      : undefined;
  }
  if (type === "listTools") {
    return exactRecord(value, ["type"]) ? { type: "listTools" } : undefined;
  }
  if (type === "selectTool") {
    const record = exactRecord(value, ["type", "toolId"]);
    return record && isId(record.toolId)
      ? { type: "selectTool", toolId: record.toolId }
      : undefined;
  }
  if (type === "regexTest") {
    const record = exactRecord(value, ["type", "requestId", "pattern", "input", "flags"]);
    return record &&
      isRequestId(record.requestId) &&
      isBoundedString(record.pattern, REGEX_TEST_MAX_PATTERN_CHARS) &&
      isBoundedString(record.input, REGEX_TEST_MAX_INPUT_CHARS) &&
      isBoundedString(record.flags, 16) &&
      /^[dgimsuvy]*$/u.test(record.flags as string)
      ? {
          type: "regexTest",
          requestId: record.requestId,
          pattern: record.pattern,
          input: record.input,
          flags: record.flags,
        }
      : undefined;
  }
  return undefined;
}

export function parseHostMessage(value: unknown): HostMessage | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const type = (value as UnknownRecord).type;
  if (type === "init") {
    const record = exactRecord(value, ["type", "tool", "input", "limits"]);
    const tool = parseToolDescriptor(record?.tool);
    if (!record || !tool || !isBoundedString(record.input, PROTOCOL_MAX_TEXT_CHARS))
      return undefined;
    if (tool.renderer.kind === "text-transform") {
      const limits = exactRecord(record.limits, ["inputs", "maxOutputChars"]);
      const inputs = parseInputLimits(limits?.inputs);
      if (
        !limits ||
        !inputs ||
        !isPositiveSafeInteger(limits.maxOutputChars, PROTOCOL_MAX_TEXT_CHARS) ||
        inputs.length !== tool.renderer.operations.length ||
        !tool.renderer.operations.every(({ id }) =>
          inputs.some(({ operationId }) => operationId === id),
        )
      )
        return undefined;
      return {
        type: "init",
        tool: tool as ToolDescriptor & { renderer: TextTransformRenderer },
        input: record.input,
        limits: { inputs, maxOutputChars: limits.maxOutputChars },
      };
    }
    const limits = exactRecord(record.limits, ["maxInputChars", "maxOutputChars"]);
    if (
      !limits ||
      !isPositiveSafeInteger(limits.maxInputChars, PROTOCOL_MAX_TEXT_CHARS) ||
      !isPositiveSafeInteger(limits.maxOutputChars, PROTOCOL_MAX_TEXT_CHARS)
    )
      return undefined;
    return {
      type: "init",
      tool: tool as ToolDescriptor & { renderer: TextInspectRenderer },
      input: record.input,
      limits: { maxInputChars: limits.maxInputChars, maxOutputChars: limits.maxOutputChars },
    };
  }
  if (type === "transformResult") return parseTextResult(value, "transformResult");
  if (type === "inspectResult") {
    const candidate = value as UnknownRecord;
    if (candidate.ok === true) {
      const record = exactRecord(value, ["type", "requestId", "toolId", "ok", "inspection"]);
      const inspection = parseInspection(record?.inspection);
      return record && isRequestId(record.requestId) && isId(record.toolId) && inspection
        ? {
            type: "inspectResult",
            requestId: record.requestId,
            toolId: record.toolId,
            ok: true,
            inspection,
          }
        : undefined;
    }
    return parseFailure(value, "inspectResult");
  }
  if (type === "copyResult") {
    const candidate = value as UnknownRecord;
    if (candidate.ok === true) {
      const record = exactRecord(value, ["type", "requestId", "toolId", "ok"]);
      return record && isRequestId(record.requestId) && isId(record.toolId)
        ? { type: "copyResult", requestId: record.requestId, toolId: record.toolId, ok: true }
        : undefined;
    }
    if (candidate.ok === false) {
      const record = exactRecord(value, ["type", "requestId", "toolId", "ok", "message"]);
      return record &&
        isRequestId(record.requestId) &&
        isId(record.toolId) &&
        isBoundedString(record.message, PROTOCOL_MAX_DESCRIPTION_CHARS, false)
        ? {
            type: "copyResult",
            requestId: record.requestId,
            toolId: record.toolId,
            ok: false,
            message: record.message,
          }
        : undefined;
    }
  }
  if (type === "toolsList") {
    const record =
      exactRecord(value, ["type", "tools", "activeToolId", "initialInput"]) ??
      exactRecord(value, ["type", "tools", "activeToolId", "initialInput", "collapseSidebar"]);
    if (
      !record ||
      !Array.isArray(record.tools) ||
      !isId(record.activeToolId) ||
      !isBoundedString(record.initialInput, PROTOCOL_MAX_TEXT_CHARS)
    )
      return undefined;
    const tools: CatalogToolEntry[] = [];
    for (const entry of record.tools) {
      const item = entry as UnknownRecord | null;
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item) ||
        !isId(item.id) ||
        !isId(item.slug) ||
        !isBoundedString(item.shortName, PROTOCOL_MAX_LABEL_CHARS, false) ||
        !isBoundedString(item.name, PROTOCOL_MAX_LABEL_CHARS, false) ||
        !isBoundedString(item.description, PROTOCOL_MAX_DESCRIPTION_CHARS, false) ||
        !isId(item.family)
      )
        return undefined;
      tools.push({
        id: item.id,
        slug: item.slug,
        shortName: item.shortName,
        name: item.name,
        description: item.description,
        family: item.family,
      });
    }
    return {
      type: "toolsList",
      tools,
      activeToolId: record.activeToolId,
      initialInput: record.initialInput,
      ...(typeof record.collapseSidebar === "boolean"
        ? { collapseSidebar: record.collapseSidebar }
        : {}),
    };
  }
  if (type === "themeChanged") {
    const record = exactRecord(value, ["type", "kind"]);
    return record && (record.kind === "light" || record.kind === "dark")
      ? { type: "themeChanged", kind: record.kind }
      : undefined;
  }
  if (type === "regexResult") {
    const record = exactRecord(value, ["type", "requestId", "result"]);
    if (!record || !isRequestId(record.requestId)) return undefined;
    const result = parseRegexTestResult(record.result);
    return result
      ? { type: "regexResult", requestId: record.requestId, result }
      : undefined;
  }
  return undefined;
}

function parseTextResult(value: unknown, type: "transformResult"): HostMessage | undefined {
  const candidate = value as UnknownRecord;
  if (candidate.ok === true) {
    const record = exactRecord(value, ["type", "requestId", "toolId", "ok", "value"]);
    return record &&
      isRequestId(record.requestId) &&
      isId(record.toolId) &&
      isBoundedString(record.value, PROTOCOL_MAX_TEXT_CHARS)
      ? { type, requestId: record.requestId, toolId: record.toolId, ok: true, value: record.value }
      : undefined;
  }
  return parseFailure(value, type);
}
function parseFailure(
  value: unknown,
  type: "transformResult" | "inspectResult",
): HostMessage | undefined {
  const record = exactRecord(value, ["type", "requestId", "toolId", "ok", "code", "message"]);
  return record &&
    record.ok === false &&
    isRequestId(record.requestId) &&
    isId(record.toolId) &&
    isBoundedString(record.code, PROTOCOL_MAX_ID_CHARS, false) &&
    isBoundedString(record.message, PROTOCOL_MAX_DESCRIPTION_CHARS, false)
    ? {
        type,
        requestId: record.requestId,
        toolId: record.toolId,
        ok: false,
        code: record.code,
        message: record.message,
      }
    : undefined;
}
function parseInspection(value: unknown): JsonInspection | undefined {
  const record = exactRecord(value, [
    "formatted",
    "rootType",
    "totalValues",
    "objectCount",
    "arrayCount",
    "stringCount",
    "numberCount",
    "booleanCount",
    "nullCount",
    "maxDepth",
  ]);
  if (
    !record ||
    !isBoundedString(record.formatted, JSON_FORMATTER_MAX_OUTPUT_CHARS) ||
    !["object", "array", "string", "number", "boolean", "null"].includes(String(record.rootType)) ||
    !isPositiveSafeInteger(record.totalValues, JSON_FORMATTER_MAX_NODES) ||
    !isNonNegativeBoundedSafeInteger(record.maxDepth, JSON_FORMATTER_MAX_DEPTH)
  )
    return undefined;
  const counts = [
    record.objectCount,
    record.arrayCount,
    record.stringCount,
    record.numberCount,
    record.booleanCount,
    record.nullCount,
  ];
  if (!counts.every((count) => isNonNegativeBoundedSafeInteger(count, JSON_FORMATTER_MAX_NODES)))
    return undefined;
  const rootIndex = ["object", "array", "string", "number", "boolean", "null"].indexOf(
    String(record.rootType),
  );
  const rootCount = counts[rootIndex];
  if (
    counts.reduce((total, count) => total + count, 0) !== record.totalValues ||
    rootCount === undefined ||
    rootCount === 0
  )
    return undefined;
  return record as JsonInspection;
}

function parseRegexTestResult(value: unknown): ToolResult<RegexTestResult> | undefined {
  const candidate = value as UnknownRecord | null;
  if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) return undefined;
  if (candidate.ok === true) {
    const inner = exactRecord(value, ["ok", "value"]);
    if (!inner) return undefined;
    const result = inner.value as UnknownRecord | null;
    if (
      !result ||
      !Array.isArray(result.matches) ||
      result.matches.length > 1000 ||
      (result.truncated !== true && result.truncated !== false)
    )
      return undefined;
    return { ok: true, value: result as unknown as RegexTestResult };
  }
  if (candidate.ok === false) {
    const inner = exactRecord(value, ["ok", "error"]);
    if (!inner) return undefined;
    const error = exactRecord(inner.error, ["code", "message"]);
    if (
      !error ||
      !isBoundedString(error.code, 64, false) ||
      !isBoundedString(error.message, 320, false)
    )
      return undefined;
    return { ok: false, error: { code: error.code, message: error.message } };
  }
  return undefined;
}
