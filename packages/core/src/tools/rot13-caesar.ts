import { err, ok, type ToolResult } from "../result";

/** Bound the browser transform to a predictable linear amount of work. */
export const ROT13_CAESAR_MAX_INPUT_CHARS = 2_000_000;

export type Rot13CaesarMode = "encode" | "decode";

/**
 * Rotate ASCII Latin letters by a Caesar shift while preserving case and every
 * non-Latin character verbatim. The explicit helper is reusable for future
 * shift controls; the public ROT13 UI always passes 13.
 */
export function rotateCaesar(input: string, shift: number): ToolResult<string> {
  if (input.length > ROT13_CAESAR_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Text input exceeds ${ROT13_CAESAR_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }
  if (!Number.isInteger(shift) || shift < 0 || shift > 25) {
    return err("INVALID_SHIFT", "Caesar shift must be a whole number from 0 to 25.");
  }

  let output = "";
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    if (code >= 65 && code <= 90) {
      output += String.fromCharCode(((code - 65 + shift) % 26) + 65);
    } else if (code >= 97 && code <= 122) {
      output += String.fromCharCode(((code - 97 + shift) % 26) + 97);
    } else {
      output += input[index] ?? "";
    }
  }
  return ok(output);
}

/** ROT13 is self-inverse, so encode and decode intentionally use the same shift. */
export function runRot13Caesar(mode: Rot13CaesarMode, input: string): ToolResult<string> {
  if (mode !== "encode" && mode !== "decode") {
    return err("INVALID_MODE", "Choose ROT13 encode or decode mode.");
  }
  return rotateCaesar(input, 13);
}
