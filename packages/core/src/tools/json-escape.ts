import { err, ok, type ToolResult } from "../result";

/** Direction supported by the JSON Escape tool. */
export type JsonEscapeMode = "encode" | "decode";

/** Maximum UTF-16 plain-text size accepted while encoding. */
export const JSON_ESCAPE_MAX_INPUT_CHARS = 2_000_000;
/** Maximum encoded JSON-literal size accepted while decoding. */
export const JSON_ESCAPE_MAX_ENCODED_CHARS = JSON_ESCAPE_MAX_INPUT_CHARS * 6 + 2;

/**
 * Encode plain text as a JSON string literal.
 *
 * The returned value includes its surrounding quotes, so it can be pasted
 * directly wherever a JSON string value is expected. `JSON.stringify` also
 * safely escapes control characters, quotes, backslashes, and lone surrogates.
 */
export function escapeJson(input: string): ToolResult<string> {
  const size = validateInputSize(input, JSON_ESCAPE_MAX_INPUT_CHARS, "JSON Escape");
  if (!size.ok) return size;

  return ok(JSON.stringify(input));
}

/**
 * Decode one JSON string literal into its plain text value.
 *
 * Objects, arrays, numbers, booleans, and null are rejected intentionally: this
 * tool is for string escaping, not a general JSON parser.
 */
export function unescapeJson(input: string): ToolResult<string> {
  const size = validateInputSize(input, JSON_ESCAPE_MAX_ENCODED_CHARS, "JSON string literal");
  if (!size.ok) return size;

  let parsed: unknown;
  try {
    parsed = JSON.parse(input) as unknown;
  } catch (cause) {
    const detail = cause instanceof SyntaxError && cause.message ? ` ${cause.message}` : "";
    return err("INVALID_JSON_STRING", `Input is not a valid JSON string literal.${detail}`);
  }

  if (typeof parsed !== "string") {
    return err(
      "JSON_STRING_REQUIRED",
      "Input must be a JSON string literal, not another JSON value.",
    );
  }

  if (parsed.length > JSON_ESCAPE_MAX_INPUT_CHARS) {
    return err(
      "OUTPUT_TOO_LARGE",
      `Decoded text exceeds the ${JSON_ESCAPE_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }

  return ok(parsed);
}

/** Host-neutral entry point shared by web, extension, and editor adapters. */
export function runJsonEscape(mode: JsonEscapeMode, input: string): ToolResult<string> {
  if (mode === "encode") return escapeJson(input);
  if (mode === "decode") return unescapeJson(input);
  return err("INVALID_MODE", "JSON Escape mode must be either encode or decode.");
}

function validateInputSize(input: string, maxChars: number, label: string): ToolResult<string> {
  if (input.length > maxChars) {
    return err("INPUT_TOO_LARGE", `${label} exceeds ${maxChars.toLocaleString()} characters.`);
  }
  return ok(input);
}
