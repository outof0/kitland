import type { Base64Mode, ToolResult } from "@kitland/core";

/** A single conversion request sent from the interactive tool to its worker. */
export type Base64WorkerRequest = {
  type: "transform";
  id: number;
  mode: Base64Mode;
  input: string;
  urlSafe: boolean;
};

/** A conversion response. The request id makes out-of-order responses safe. */
export type Base64WorkerResponse = {
  type: "result";
  id: number;
  result: ToolResult<string>;
  /** UTF-8 byte length of a successful result, measured off the main thread. */
  outputByteLength: number;
};

export function isBase64WorkerRequest(value: unknown): value is Base64WorkerRequest {
  if (!isRecord(value)) return false;

  return (
    value.type === "transform" &&
    isRequestId(value.id) &&
    isBase64Mode(value.mode) &&
    typeof value.input === "string" &&
    typeof value.urlSafe === "boolean"
  );
}

export function isBase64WorkerResponse(value: unknown): value is Base64WorkerResponse {
  if (!isRecord(value) || value.type !== "result" || !isRequestId(value.id)) {
    return false;
  }

  return isToolResult(value.result) && isByteLength(value.outputByteLength);
}

function isBase64Mode(value: unknown): value is Base64Mode {
  return value === "encode" || value === "decode";
}

function isRequestId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isByteLength(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isToolResult(value: unknown): value is ToolResult<string> {
  if (!isRecord(value) || typeof value.ok !== "boolean") return false;

  if (value.ok) return typeof value.value === "string";

  return (
    isRecord(value.error) &&
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
