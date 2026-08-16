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
 * Normalizes a server-authored error message and bounds it to 240 UTF-8 bytes.
 * Callers must not pass input-derived strings to this helper.
 */
export function sanitizeErrorMessage(message: string): string {
  const normalized = message
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (measureUtf8Bytes(normalized) <= MAX_ERROR_MESSAGE_BYTES) {
    return normalized;
  }
  // Trim character by character until within 240 bytes
  let truncated = normalized;
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
