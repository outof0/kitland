import {
  REGEX_TEST_MAX_INPUT_CHARS,
  REGEX_TEST_MAX_MATCHES,
  REGEX_TEST_MAX_PATTERN_CHARS,
  type RegexTestResult,
  type ToolResult,
} from "@kitland/core";

const MAX_ERROR_CODE_CHARS = 64;
const MAX_ERROR_MESSAGE_CHARS = 320;

export type RegexTesterWorkerRequest = {
  type: "test";
  id: number;
  pattern: string;
  input: string;
  flags: string;
};

export type RegexTesterWorkerResponse = {
  type: "result";
  id: number;
  result: ToolResult<RegexTestResult>;
};

export function isRegexTesterWorkerRequest(value: unknown): value is RegexTesterWorkerRequest {
  const record = exactRecord(value, ["type", "id", "pattern", "input", "flags"]);
  return Boolean(
    record &&
      record.type === "test" &&
      isRequestId(record.id) &&
      isBoundedString(record.pattern, REGEX_TEST_MAX_PATTERN_CHARS) &&
      isBoundedString(record.input, REGEX_TEST_MAX_INPUT_CHARS) &&
      isBoundedString(record.flags, 16) &&
      /^[dgimsuvy]*$/u.test(record.flags as string),
  );
}

export function isRegexTesterWorkerResponse(
  value: unknown,
): value is RegexTesterWorkerResponse {
  const record = exactRecord(value, ["type", "id", "result"]);
  return Boolean(record && record.type === "result" && isRequestId(record.id) && isResult(record.result));
}

function isResult(value: unknown): value is ToolResult<RegexTestResult> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.ok === true) {
    const record = exactRecord(value, ["ok", "value"]);
    if (!record) return false;
    const result = record.value as { matches?: unknown; truncated?: unknown };
    return (
      Array.isArray(result.matches) &&
      result.matches.length <= REGEX_TEST_MAX_MATCHES &&
      (result.truncated === true || result.truncated === false)
    );
  }
  if (candidate.ok === false) {
    const record = exactRecord(value, ["ok", "error"]);
    if (!record) return false;
    const error = exactRecord(record.error, ["code", "message"]);
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

function isRequestId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isBoundedString(value: unknown, maximum: number, allowEmpty = true): value is string {
  return typeof value === "string" && value.length <= maximum && (allowEmpty || value.length > 0);
}
