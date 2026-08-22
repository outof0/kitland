import { err, ok, type ToolResult } from "../result";

/** Direction supported by the JSON Escape tool. */
export type JsonEscapeMode = "encode" | "decode";

/** Options for escaping text as JSON. */
export interface JsonEscapeOptions {
  /**
   * Whether to wrap the output in double quotes `"..."`.
   * @default true
   */
  readonly wrapQuotes?: boolean;

  /**
   * Whether to escape forward slashes `/` -> `\/`.
   * Useful when embedding JSON into HTML `<script>` tags to prevent `</script>` breakouts.
   * @default false
   */
  readonly escapeSlashes?: boolean;

  /**
   * Whether to escape non-ASCII / Unicode characters to `\uXXXX` (and surrogate pairs).
   * When false (default), valid UTF-8 characters are preserved directly in the JSON string.
   * @default false
   */
  readonly escapeUnicode?: boolean;
}

/** Options for decoding / unescaping JSON string. */
export interface JsonUnescapeOptions {
  /**
   * Whether to auto-detect and unwrap enclosing quote pairs (`"..."` or `'...'`).
   * @default true
   */
  readonly unwrapQuotes?: boolean;
}

/** Maximum UTF-16 plain-text size accepted while encoding. */
export const JSON_ESCAPE_MAX_INPUT_CHARS = 2_000_000;
/** Maximum encoded JSON-literal size accepted while decoding. */
export const JSON_ESCAPE_MAX_ENCODED_CHARS = JSON_ESCAPE_MAX_INPUT_CHARS * 6 + 2;

/**
 * Encode plain text, code, or raw JSON as a JSON-escaped string.
 */
export function escapeJson(input: string, options: JsonEscapeOptions = {}): ToolResult<string> {
  const size = validateInputSize(input, JSON_ESCAPE_MAX_INPUT_CHARS, "JSON Escape");
  if (!size.ok) return size;

  const { wrapQuotes = true, escapeSlashes = false, escapeUnicode = false } = options;

  let escaped: string;
  if (!escapeUnicode && !escapeSlashes) {
    escaped = JSON.stringify(input);
    if (!wrapQuotes) {
      escaped = escaped.slice(1, -1);
    }
  } else {
    const parts: string[] = [];
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      const char = input[i]!;

      // Handle surrogate pairs for escapeUnicode
      if (code >= 0xd800 && code <= 0xdbff && i + 1 < input.length) {
        const nextCode = input.charCodeAt(i + 1);
        if (nextCode >= 0xdc00 && nextCode <= 0xdfff) {
          if (escapeUnicode) {
            parts.push(
              `\\u${code.toString(16).padStart(4, "0")}\\u${nextCode.toString(16).padStart(4, "0")}`,
            );
          } else {
            parts.push(char + input[i + 1]);
          }
          i++;
          continue;
        }
      }

      switch (char) {
        case '"':
          parts.push('\\"');
          break;
        case "\\":
          parts.push("\\\\");
          break;
        case "\b":
          parts.push("\\b");
          break;
        case "\f":
          parts.push("\\f");
          break;
        case "\n":
          parts.push("\\n");
          break;
        case "\r":
          parts.push("\\r");
          break;
        case "\t":
          parts.push("\\t");
          break;
        case "/":
          parts.push(escapeSlashes ? "\\/" : "/");
          break;
        default:
          if (code < 0x20 || (escapeUnicode && code > 0x7f) || (code >= 0xd800 && code <= 0xdfff)) {
            parts.push(`\\u${code.toString(16).padStart(4, "0")}`);
          } else {
            parts.push(char);
          }
          break;
      }
    }
    const inner = parts.join("");
    escaped = wrapQuotes ? `"${inner}"` : inner;
  }

  return ok(escaped);
}

/**
 * Check if string is enclosed by matching quote pair (double quotes `"..."` or single quotes `'...'`).
 */
function isSingleQuotedWrapper(input: string): boolean {
  if (input.length < 2) return false;
  const quote = input[0];
  if (quote !== '"' && quote !== "'") return false;
  if (input[input.length - 1] !== quote) return false;

  let escaped = false;
  for (let i = 1; i < input.length - 1; i++) {
    const c = input[i];
    if (escaped) {
      escaped = false;
    } else if (c === "\\") {
      escaped = true;
    } else if (c === quote) {
      return false;
    }
  }
  return !escaped;
}

/**
 * Decode / unescape any JSON string, quoted literal, or unquoted escaped text.
 */
export function unescapeJson(input: string, options: JsonUnescapeOptions = {}): ToolResult<string> {
  const size = validateInputSize(input, JSON_ESCAPE_MAX_ENCODED_CHARS, "JSON string literal");
  if (!size.ok) return size;

  const { unwrapQuotes = true } = options;

  let raw = input;
  if (unwrapQuotes && isSingleQuotedWrapper(raw)) {
    raw = raw.slice(1, -1);
  }

  const result: string[] = [];
  let i = 0;
  const len = raw.length;

  while (i < len) {
    const c = raw[i]!;
    if (c === "\\" && i + 1 < len) {
      const next = raw[i + 1]!;
      switch (next) {
        case '"':
          result.push('"');
          i += 2;
          break;
        case "'":
          result.push("'");
          i += 2;
          break;
        case "\\":
          result.push("\\");
          i += 2;
          break;
        case "/":
          result.push("/");
          i += 2;
          break;
        case "b":
          result.push("\b");
          i += 2;
          break;
        case "f":
          result.push("\f");
          i += 2;
          break;
        case "n":
          result.push("\n");
          i += 2;
          break;
        case "r":
          result.push("\r");
          i += 2;
          break;
        case "t":
          result.push("\t");
          i += 2;
          break;
        case "v":
          result.push("\v");
          i += 2;
          break;
        case "0":
          result.push("\0");
          i += 2;
          break;
        case "u": {
          if (raw[i + 2] === "{") {
            const closeIdx = raw.indexOf("}", i + 3);
            if (closeIdx !== -1 && closeIdx - i <= 12) {
              const hex = raw.slice(i + 3, closeIdx);
              if (/^[0-9a-fA-F]+$/.test(hex)) {
                const codePoint = parseInt(hex, 16);
                if (codePoint <= 0x10ffff) {
                  result.push(String.fromCodePoint(codePoint));
                  i = closeIdx + 1;
                  break;
                }
              }
            }
          }

          const hex4 = raw.slice(i + 2, i + 6);
          if (/^[0-9a-fA-F]{4}$/.test(hex4)) {
            const codePoint = parseInt(hex4, 16);
            if (codePoint >= 0xd800 && codePoint <= 0xdbff && raw.slice(i + 6, i + 8) === "\\u") {
              const lowHex = raw.slice(i + 8, i + 12);
              if (/^[0-9a-fA-F]{4}$/.test(lowHex)) {
                const lowCodePoint = parseInt(lowHex, 16);
                if (lowCodePoint >= 0xdc00 && lowCodePoint <= 0xdfff) {
                  const fullCodePoint =
                    ((codePoint - 0xd800) << 10) + (lowCodePoint - 0xdc00) + 0x10000;
                  result.push(String.fromCodePoint(fullCodePoint));
                  i += 12;
                  break;
                }
              }
            }
            result.push(String.fromCharCode(codePoint));
            i += 6;
          } else {
            result.push("\\");
            i += 1;
          }
          break;
        }
        case "x": {
          const hex2 = raw.slice(i + 2, i + 4);
          if (/^[0-9a-fA-F]{2}$/.test(hex2)) {
            result.push(String.fromCharCode(parseInt(hex2, 16)));
            i += 4;
          } else {
            result.push("\\");
            i += 1;
          }
          break;
        }
        default:
          result.push(next);
          i += 2;
          break;
      }
    } else {
      result.push(c);
      i += 1;
    }
  }

  const output = result.join("");

  if (output.length > JSON_ESCAPE_MAX_INPUT_CHARS) {
    return err(
      "OUTPUT_TOO_LARGE",
      `Decoded text exceeds the ${JSON_ESCAPE_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }

  return ok(output);
}

/** Host-neutral entry point shared by web, extension, and editor adapters. */
export function runJsonEscape(
  mode: JsonEscapeMode,
  input: string,
  options?: JsonEscapeOptions | JsonUnescapeOptions,
): ToolResult<string> {
  if (mode === "encode") return escapeJson(input, options as JsonEscapeOptions | undefined);
  if (mode === "decode") return unescapeJson(input, options as JsonUnescapeOptions | undefined);
  return err("INVALID_MODE", "JSON Escape mode must be either encode or decode.");
}

function validateInputSize(input: string, maxChars: number, label: string): ToolResult<string> {
  if (input.length > maxChars) {
    return err("INPUT_TOO_LARGE", `${label} exceeds ${maxChars.toLocaleString()} characters.`);
  }
  return ok(input);
}
