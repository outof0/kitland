import { measureUtf8Bytes } from "./limits.ts";

export const MAX_ERROR_MESSAGE_BYTES = 240;

export type McpErrorCode =
  | "INVALID_INPUT"
  | "INPUT_TOO_LARGE"
  | "OUTPUT_TOO_LARGE"
  | "DEADLINE_EXCEEDED"
  | "INTERNAL_ERROR";

export type McpErrorPayload = {
  readonly ok: false;
  readonly error: {
    readonly code: McpErrorCode;
    readonly message: string;
  };
};

/**
 * Truncates and santizes an error message so it never exceeds 240 UTF-8 bytes
 * and remains free of raw input quotes or stack traces.
 */
export function sanitizeErrorMessage(message: string): string {
  if (measureUtf8Bytes(message) <= MAX_ERROR_MESSAGE_BYTES) {
    return message;
  }
  // Trim character by character until within 240 bytes
  let truncated = message;
  while (measureUtf8Bytes(truncated) > MAX_ERROR_MESSAGE_BYTES && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated;
}

/**
 * Create a standardized, bounded error payload.
 */
export function createMcpError(code: McpErrorCode, message: string): McpErrorPayload {
  return {
    ok: false,
    error: {
      code,
      message: sanitizeErrorMessage(message),
    },
  };
}

export const SHARED_ERROR_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["ok", "error"],
  properties: {
    ok: { const: false },
    error: {
      type: "object",
      additionalProperties: false,
      required: ["code", "message"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
      },
    },
  },
} as const;
