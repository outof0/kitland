import type { ToolResult } from "@kitland/core";
import type {
  EncodingTextFormat,
  EncodingTextMode,
  EncodingTextTool,
} from "@kitland/ui/tools/encoding-text-transform";

/**
 * The largest bounded payload accepted by the shared encoding worker.
 * Hex output is the widest current member of this family: 2,000,000 UTF-16
 * units of source can expand to at most 18,000,000 hexadecimal characters.
 */
export const ENCODING_TEXT_WORKER_MAX_CHARS = 18_000_000;

const MAX_ERROR_CODE_CHARS = 64;
const MAX_ERROR_MESSAGE_CHARS = 320;

export type EncodingTextWorkerRequest = {
  readonly type: "transform";
  readonly id: number;
  readonly tool: EncodingTextTool;
  readonly mode: EncodingTextMode;
  readonly input: string;
  readonly format?: EncodingTextFormat;
};

export type EncodingTextWorkerResponse = {
  readonly type: "result";
  readonly id: number;
  readonly result: ToolResult<string>;
};

/** Reject malformed or oversized cross-thread messages before rendering them. */
export function isEncodingTextWorkerRequest(value: unknown): value is EncodingTextWorkerRequest {
  const record = recordWithOnly(value, ["type", "id", "tool", "mode", "input", "format"]);
  return Boolean(
    record &&
    record.type === "transform" &&
    isRequestId(record.id) &&
    isTool(record.tool) &&
    isMode(record.mode) &&
    isBoundedString(record.input, ENCODING_TEXT_WORKER_MAX_CHARS) &&
    isFormatForTool(record.tool, record.format),
  );
}

/**
 * Treat a malformed worker response as an unavailable worker. The UI must
 * never surface an arbitrary object or retain a previous result for a new
 * input after a protocol fault.
 */
export function isEncodingTextWorkerResponse(value: unknown): value is EncodingTextWorkerResponse {
  const record = exactRecord(value, ["type", "id", "result"]);
  return Boolean(
    record && record.type === "result" && isRequestId(record.id) && isTextResult(record.result),
  );
}

function isTextResult(value: unknown): value is ToolResult<string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.ok === true) {
    const record = exactRecord(value, ["ok", "value"]);
    return Boolean(record && isBoundedString(record.value, ENCODING_TEXT_WORKER_MAX_CHARS));
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

function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(record, key))
    ? record
    : undefined;
}

function recordWithOnly(
  value: unknown,
  allowedKeys: readonly string[],
): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  return Object.keys(record).every((key) => allowedKeys.includes(key)) ? record : undefined;
}

function isRequestId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isBoundedString(value: unknown, maximum: number, allowEmpty = true): value is string {
  return typeof value === "string" && value.length <= maximum && (allowEmpty || value.length > 0);
}

function isTool(value: unknown): value is EncodingTextTool {
  return [
    "html-entities",
    "url-encode",
    "base64",
    "hex-text",
    "unicode-converter",
    "binary-text",
    "rot13-caesar",
    "morse-code",
  ].includes(String(value));
}

function isMode(value: unknown): value is EncodingTextMode {
  return value === "encode" || value === "decode";
}

function isFormatForTool(
  tool: EncodingTextTool,
  value: unknown,
): value is EncodingTextFormat | undefined {
  if (tool === "html-entities") {
    return (
      value === undefined || value === "named" || value === "decimal" || value === "hexadecimal"
    );
  }
  if (tool === "hex-text") return value === undefined || value === "spaced" || value === "compact";
  return value === undefined;
}
