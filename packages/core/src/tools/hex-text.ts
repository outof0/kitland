import { err, ok, type ToolResult } from "../result";

export type HexTextMode = "encode" | "decode";
export type HexTextFormat = "spaced" | "compact";
export type HexTextOptions = { format?: HexTextFormat };

export const HEX_TEXT_MAX_INPUT_CHARS = 2_000_000;
export const HEX_TEXT_MAX_UTF8_BYTES = HEX_TEXT_MAX_INPUT_CHARS * 3;
export const HEX_TEXT_MAX_ENCODED_CHARS = HEX_TEXT_MAX_UTF8_BYTES * 3;

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

/** Convert well-formed Unicode text to lowercase UTF-8 byte notation. */
export function encodeHexText(input: string, options: HexTextOptions = {}): ToolResult<string> {
  const checked = validateUnicodeText(input);
  if (!checked.ok) return checked;

  const bytes = ENCODER.encode(input);
  if (bytes.length > HEX_TEXT_MAX_UTF8_BYTES) {
    return err(
      "INPUT_TOO_LARGE",
      `Text exceeds ${HEX_TEXT_MAX_UTF8_BYTES.toLocaleString()} UTF-8 bytes.`,
    );
  }

  const format = options.format ?? "spaced";
  const parts = Array.from(bytes, (byte) => (byte ?? 0).toString(16).padStart(2, "0"));
  return ok(parts.join(format === "spaced" ? " " : ""));
}

/** Decode lowercase or uppercase hexadecimal UTF-8 bytes. Whitespace is cosmetic only. */
export function decodeHexText(input: string): ToolResult<string> {
  if (input.length > HEX_TEXT_MAX_ENCODED_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Hex input exceeds ${HEX_TEXT_MAX_ENCODED_CHARS.toLocaleString()} characters.`,
    );
  }

  const compact = input.replace(/\s/g, "");
  if (!/^[0-9a-fA-F]*$/.test(compact) || compact.length % 2 !== 0) {
    return err(
      "INVALID_HEX",
      "Hex input must contain complete byte pairs (0-9, A-F), optionally spaced.",
    );
  }
  if (compact.length / 2 > HEX_TEXT_MAX_UTF8_BYTES) {
    return err(
      "INPUT_TOO_LARGE",
      `Hex input exceeds ${HEX_TEXT_MAX_UTF8_BYTES.toLocaleString()} UTF-8 bytes.`,
    );
  }

  const bytes = new Uint8Array(compact.length / 2);
  for (let index = 0; index < compact.length; index += 2) {
    bytes[index / 2] = Number.parseInt(compact.slice(index, index + 2), 16);
  }

  try {
    return ok(DECODER.decode(bytes));
  } catch {
    return err("INVALID_UTF8", "Hex bytes are not valid UTF-8 text.");
  }
}

export function runHexTextTransform(
  mode: HexTextMode,
  input: string,
  options: HexTextOptions = {},
): ToolResult<string> {
  if (mode === "encode") return encodeHexText(input, options);
  if (mode === "decode") return decodeHexText(input);
  return err("INVALID_MODE", "Hex text mode must be either encode or decode.");
}

function validateUnicodeText(input: string): ToolResult<string> {
  if (input.length > HEX_TEXT_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Text input exceeds ${HEX_TEXT_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  for (let index = 0; index < input.length; index += 1) {
    const unit = input.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = input.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        index += 1;
        continue;
      }
      return err("INVALID_UNICODE", "Text contains an unpaired Unicode surrogate.");
    }
    if (unit >= 0xdc00 && unit <= 0xdfff) {
      return err("INVALID_UNICODE", "Text contains an unpaired Unicode surrogate.");
    }
  }
  return ok(input);
}
