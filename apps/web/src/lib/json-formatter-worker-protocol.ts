import {
  JSON_FORMATTER_MAX_DEPTH,
  JSON_FORMATTER_MAX_INPUT_CHARS,
  JSON_FORMATTER_MAX_NODES,
  JSON_FORMATTER_MAX_OUTPUT_CHARS,
  type JsonFormatMode,
  type JsonInspection,
  type ToolResult,
} from "@kitland/core";

const MAX_ERROR_CODE_CHARS = 64;
const MAX_ERROR_MESSAGE_CHARS = 320;

export type JsonFormatterWorkerRequest = {
  type: "inspect";
  id: number;
  source: string;
  indent: 2 | 4 | "tab";
  mode: JsonFormatMode;
};

export type JsonFormatterWorkerResponse = {
  type: "result";
  id: number;
  result: ToolResult<JsonInspection>;
};

export function isJsonFormatterWorkerRequest(value: unknown): value is JsonFormatterWorkerRequest {
  const record = exactRecord(value, ["type", "id", "source", "indent", "mode"]);
  return Boolean(
    record &&
    record.type === "inspect" &&
    isRequestId(record.id) &&
    isBoundedString(record.source, JSON_FORMATTER_MAX_INPUT_CHARS) &&
    (record.indent === 2 || record.indent === 4 || record.indent === "tab") &&
    (record.mode === "beautify" || record.mode === "minify"),
  );
}

export function isJsonFormatterWorkerResponse(
  value: unknown,
): value is JsonFormatterWorkerResponse {
  const record = exactRecord(value, ["type", "id", "result"]);
  return Boolean(
    record &&
    record.type === "result" &&
    isRequestId(record.id) &&
    isInspectionResult(record.result),
  );
}

function isInspectionResult(value: unknown): value is ToolResult<JsonInspection> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.ok === true) {
    const record = exactRecord(value, ["ok", "value"]);
    return Boolean(record && isInspection(record.value));
  }
  if (candidate.ok === false) {
    const record = exactRecord(value, ["ok", "error"]);
    const error = exactRecord(record?.error, ["code", "message"]);
    return Boolean(
      error &&
      isBoundedString(error.code, MAX_ERROR_CODE_CHARS, false) &&
      isBoundedString(error.message, MAX_ERROR_MESSAGE_CHARS, false),
    );
  }
  return false;
}

function isInspection(value: unknown): value is JsonInspection {
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
    !isRootType(record.rootType) ||
    !isPositiveBoundedSafeInteger(record.totalValues, JSON_FORMATTER_MAX_NODES) ||
    !isNonNegativeBoundedSafeInteger(record.maxDepth, JSON_FORMATTER_MAX_DEPTH)
  ) {
    return false;
  }
  const counts = [
    record.objectCount,
    record.arrayCount,
    record.stringCount,
    record.numberCount,
    record.booleanCount,
    record.nullCount,
  ];
  if (!counts.every((count) => isNonNegativeBoundedSafeInteger(count, JSON_FORMATTER_MAX_NODES))) {
    return false;
  }
  const rootIndex = ["object", "array", "string", "number", "boolean", "null"].indexOf(
    record.rootType,
  );
  const rootCount = counts[rootIndex];
  return (
    counts.reduce((total, count) => total + count, 0) === record.totalValues &&
    rootCount !== undefined &&
    rootCount > 0
  );
}

function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(record, key))
    ? record
    : undefined;
}

function isRequestId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isBoundedString(value: unknown, maximum: number, allowEmpty = true): value is string {
  return typeof value === "string" && value.length <= maximum && (allowEmpty || value.length > 0);
}

function isPositiveBoundedSafeInteger(value: unknown, maximum: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= maximum;
}

function isNonNegativeBoundedSafeInteger(value: unknown, maximum: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= maximum;
}

function isRootType(value: unknown): value is JsonInspection["rootType"] {
  return ["object", "array", "string", "number", "boolean", "null"].includes(String(value));
}
