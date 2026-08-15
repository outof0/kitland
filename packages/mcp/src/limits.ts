const TEXT_ENCODER = new TextEncoder();

export const ARCHITECTURE_MAX_INPUT_UTF8_BYTES = 512 * 1024; // 512 KiB
export const ARCHITECTURE_MAX_OUTPUT_UTF8_BYTES = 1024 * 1024; // 1 MiB
export const ARCHITECTURE_MAX_SERIALIZED_RESULT_UTF8_BYTES = Math.floor(2.25 * 1024 * 1024); // 2.25 MiB
export const ARCHITECTURE_MAX_TIMEOUT_MS = 5000; // 5 seconds
export const MAX_STDIO_FRAME_BYTES = 4 * 1024 * 1024; // 4 MiB frame limit

export type McpLimits = {
  readonly maxInputUtf8Bytes: number;
  readonly maxOutputUtf8Bytes: number;
  readonly maxSerializedResultUtf8Bytes: number;
  readonly timeoutMs: number;
};

export const DEFAULT_MCP_LIMITS: McpLimits = {
  maxInputUtf8Bytes: ARCHITECTURE_MAX_INPUT_UTF8_BYTES,
  maxOutputUtf8Bytes: ARCHITECTURE_MAX_OUTPUT_UTF8_BYTES,
  maxSerializedResultUtf8Bytes: ARCHITECTURE_MAX_SERIALIZED_RESULT_UTF8_BYTES,
  timeoutMs: ARCHITECTURE_MAX_TIMEOUT_MS,
};

/**
 * Measure the UTF-8 byte length of a string.
 */
export function measureUtf8Bytes(text: string): number {
  return TEXT_ENCODER.encode(text).length;
}

/**
 * Measure the UTF-8 byte length of a JSON-serializable value.
 */
export function measureJsonUtf8Bytes(value: unknown): number {
  const json = JSON.stringify(value);
  return measureUtf8Bytes(json);
}
