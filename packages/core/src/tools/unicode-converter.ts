import { err, ok, type ToolResult } from "../result";

export type UnicodeConverterMode = "encode" | "decode";

export const UNICODE_CONVERTER_MAX_INPUT_CHARS = 2_000_000;
export const UNICODE_CONVERTER_MAX_CODE_POINTS = 500_000;

/** Format every Unicode scalar value as an explicit `U+XXXX` code point. */
export function encodeUnicodeCodePoints(input: string): ToolResult<string> {
  const checked = validateUnicodeText(input);
  if (!checked.ok) return checked;

  const parts: string[] = [];
  for (const character of input) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) return err("ENCODE_FAILED", "Could not read a Unicode character.");
    parts.push(`U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`);
  }
  return ok(parts.join(" "));
}

/** Decode whitespace-separated `U+XXXX` through `U+10FFFF` Unicode scalar values. */
export function decodeUnicodeCodePoints(input: string): ToolResult<string> {
  if (input.length > UNICODE_CONVERTER_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Unicode input exceeds ${UNICODE_CONVERTER_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  const trimmed = input.trim();
  if (!trimmed) return ok("");
  const tokens = trimmed.split(/\s+/);
  if (tokens.length > UNICODE_CONVERTER_MAX_CODE_POINTS) {
    return err(
      "INPUT_TOO_LARGE",
      `Unicode input exceeds ${UNICODE_CONVERTER_MAX_CODE_POINTS.toLocaleString()} code points.`,
    );
  }

  const codePoints = Array.from<number>({ length: tokens.length });
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] ?? "";
    const match = /^U\+([0-9a-fA-F]{4,6})$/.exec(token);
    if (!match) {
      return err(
        "INVALID_CODE_POINT",
        `“${token}” is not a U+XXXX Unicode code point. Separate code points with spaces.`,
      );
    }
    const codePoint = Number.parseInt(match[1] ?? "", 16);
    if (!isUnicodeScalarValue(codePoint)) {
      return err("INVALID_CODE_POINT", `“${token}” is outside the Unicode scalar-value range.`);
    }
    codePoints[index] = codePoint;
  }
  return ok(String.fromCodePoint(...codePoints));
}

export function runUnicodeConverter(mode: UnicodeConverterMode, input: string): ToolResult<string> {
  if (mode === "encode") return encodeUnicodeCodePoints(input);
  if (mode === "decode") return decodeUnicodeCodePoints(input);
  return err("INVALID_MODE", "Unicode converter mode must be either encode or decode.");
}

function validateUnicodeText(input: string): ToolResult<string> {
  if (input.length > UNICODE_CONVERTER_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Unicode input exceeds ${UNICODE_CONVERTER_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  let codePoints = 0;
  for (let index = 0; index < input.length; index += 1) {
    const unit = input.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = input.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        index += 1;
        codePoints += 1;
        continue;
      }
      return err("INVALID_UNICODE", "Text contains an unpaired Unicode surrogate.");
    }
    if (unit >= 0xdc00 && unit <= 0xdfff) {
      return err("INVALID_UNICODE", "Text contains an unpaired Unicode surrogate.");
    }
    codePoints += 1;
  }
  if (codePoints > UNICODE_CONVERTER_MAX_CODE_POINTS) {
    return err(
      "INPUT_TOO_LARGE",
      `Text exceeds ${UNICODE_CONVERTER_MAX_CODE_POINTS.toLocaleString()} Unicode code points.`,
    );
  }
  return ok(input);
}

function isUnicodeScalarValue(codePoint: number): boolean {
  return codePoint >= 0 && codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff);
}
