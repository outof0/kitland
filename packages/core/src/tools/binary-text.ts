import { err, ok, type ToolResult } from "../result";

export type BinaryTextMode = "encode" | "decode";

export const BINARY_TEXT_MAX_INPUT_CHARS = 500_000;
export const BINARY_TEXT_MAX_UTF8_BYTES = BINARY_TEXT_MAX_INPUT_CHARS * 3;
export const BINARY_TEXT_MAX_ENCODED_CHARS = BINARY_TEXT_MAX_UTF8_BYTES * 9;

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

/** Encode UTF-8 bytes as eight-bit groups separated by one space. */
export function encodeBinaryText(input: string): ToolResult<string> {
  const checked = validateUnicodeText(input);
  if (!checked.ok) return checked;

  const bytes = ENCODER.encode(input);
  if (bytes.length > BINARY_TEXT_MAX_UTF8_BYTES) {
    return err(
      "INPUT_TOO_LARGE",
      `Text exceeds ${BINARY_TEXT_MAX_UTF8_BYTES.toLocaleString()} UTF-8 bytes.`,
    );
  }

  const groups = Array.from(bytes, (byte) => (byte ?? 0).toString(2).padStart(8, "0"));
  return ok(groups.join(" "));
}

/** Decode whitespace-separated, complete eight-bit UTF-8 byte groups. */
export function decodeBinaryText(input: string): ToolResult<string> {
  if (input.length > BINARY_TEXT_MAX_ENCODED_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Binary input exceeds ${BINARY_TEXT_MAX_ENCODED_CHARS.toLocaleString()} characters.`,
    );
  }

  const trimmed = input.trim();
  if (!trimmed) return ok("");
  const groups = trimmed.split(/\s+/);
  const bytes = new Uint8Array(groups.length);
  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index] ?? "";
    if (!/^[01]{8}$/.test(group)) {
      return err(
        "INVALID_BINARY",
        "Binary input must contain eight-bit groups (for example: 01001000), separated by spaces.",
      );
    }
    bytes[index] = Number.parseInt(group, 2);
  }

  try {
    return ok(DECODER.decode(bytes));
  } catch {
    return err("INVALID_UTF8", "Binary bytes are not valid UTF-8 text.");
  }
}

export function runBinaryTextTransform(mode: BinaryTextMode, input: string): ToolResult<string> {
  if (mode === "encode") return encodeBinaryText(input);
  if (mode === "decode") return decodeBinaryText(input);
  return err("INVALID_MODE", "Binary text mode must be either encode or decode.");
}

function validateUnicodeText(input: string): ToolResult<string> {
  if (input.length > BINARY_TEXT_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Text input exceeds ${BINARY_TEXT_MAX_INPUT_CHARS.toLocaleString()} characters.`,
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
