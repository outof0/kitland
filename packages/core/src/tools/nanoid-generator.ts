import { err, ok, type ToolResult } from "../result";

export const NANOID_DEFAULT_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-";
export const NANOID_MIN_LENGTH = 1;
export const NANOID_MAX_LENGTH = 256;
export const NANOID_MAX_ALPHABET_LENGTH = 128;

export type NanoidRandomBytes = (length: number) => Uint8Array;
export type NanoidOptions = { length: number; alphabet: string };

/** Generate a NanoID-style identifier with unbiased rejection sampling. */
export function generateNanoid(
  options: NanoidOptions,
  randomBytes: NanoidRandomBytes,
): ToolResult<string> {
  if (
    !Number.isInteger(options.length) ||
    options.length < NANOID_MIN_LENGTH ||
    options.length > NANOID_MAX_LENGTH
  )
    return err("INVALID_LENGTH", "Choose an ID length between 1 and 256.");
  const alphabet = uniqueCharacters(options.alphabet);
  if (alphabet.length < 2 || alphabet.length > NANOID_MAX_ALPHABET_LENGTH)
    return err("INVALID_ALPHABET", "Use 2 to 128 unique alphabet characters.");
  const limit = 256 - (256 % alphabet.length);
  let output = "";
  try {
    while (output.length < options.length) {
      const source = randomBytes(Math.max(16, options.length - output.length));
      if (!(source instanceof Uint8Array))
        return err("INVALID_ENTROPY", "The secure entropy source returned invalid bytes.");
      for (const byte of source) {
        if (byte < limit) output += alphabet[byte % alphabet.length] ?? "";
        if (output.length === options.length) break;
      }
    }
  } catch {
    return err(
      "ENTROPY_UNAVAILABLE",
      "Secure random generation is unavailable in this environment.",
    );
  }
  return ok(output);
}

function uniqueCharacters(value: string): string {
  return [...new Set([...value])].join("");
}
