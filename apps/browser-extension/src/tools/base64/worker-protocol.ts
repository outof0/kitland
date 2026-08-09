import type { ToolResult } from "@kitland/core";
import type { TransformQuery } from "./domain";

export type TransformRequest = TransformQuery & {
  type: "transform";
  id: number;
};

export type TransformResponse = {
  type: "result";
  id: number;
  result: ToolResult<string>;
  outputByteLength: number;
};

export function isTransformRequest(value: unknown): value is TransformRequest {
  if (!isRecord(value)) return false;
  return (
    value.type === "transform" &&
    isRequestId(value.id) &&
    (value.mode === "encode" || value.mode === "decode") &&
    (value.format === "standard" || value.format === "url-safe") &&
    typeof value.input === "string"
  );
}

export function isTransformResponse(value: unknown): value is TransformResponse {
  if (!isRecord(value) || value.type !== "result" || !isRequestId(value.id)) return false;
  if (!Number.isSafeInteger(value.outputByteLength) || Number(value.outputByteLength) < 0) {
    return false;
  }
  return isStringResult(value.result);
}

function isStringResult(value: unknown): value is ToolResult<string> {
  if (!isRecord(value) || typeof value.ok !== "boolean") return false;
  if (value.ok) return typeof value.value === "string";
  return (
    isRecord(value.error) &&
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  );
}

function isRequestId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
