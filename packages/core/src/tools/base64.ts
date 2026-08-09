import { err, ok, type ToolResult } from "../result";

export type Base64Mode = "encode" | "decode";

export type Base64Options = {
  /**
   * When true, encode/decode uses the URL-safe alphabet (`-` `_`).
   * Padding is omitted during encoding and optional, but must be canonical,
   * during decoding.
   * Default: false (standard Base64).
   */
  urlSafe?: boolean;
};

/**
 * Maximum source-text length in UTF-16 code units.
 *
 * Kept as the public input cap for backwards compatibility. A code unit can
 * expand to at most three UTF-8 bytes (including an unpaired surrogate, which
 * TextEncoder replaces with U+FFFD).
 */
export const BASE64_MAX_INPUT_CHARS = 2_000_000;

/** Maximum UTF-8 byte payload accepted by the Base64 tool. */
export const BASE64_MAX_UTF8_BYTES = BASE64_MAX_INPUT_CHARS * 3;

/**
 * Maximum raw encoded input length. This includes any formatting whitespace so
 * normalization remains bounded, and is large enough to decode every value
 * the maximum source text can encode, including worst-case UTF-8 expansion.
 */
export const BASE64_MAX_ENCODED_CHARS = 4 * Math.ceil(BASE64_MAX_UTF8_BYTES / 3);

const STANDARD_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const URL_SAFE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const STANDARD_BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;
const URL_SAFE_BASE64_PATTERN = /^[A-Za-z0-9_-]*={0,2}$/;
// oxlint-disable-next-line eslint/no-control-regex -- Only ASCII transport whitespace is valid.
const ASCII_BASE64_WHITESPACE_PATTERN = /[\x09-\x0D\x20]+/g;

const UTF8_ENCODER = new TextEncoder();
// Keep a leading U+FEFF as data so encode/decode remains a true text
// round-trip rather than silently treating it as a transport BOM.
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
const ASCII_DECODER = new TextDecoder("ascii");
const STANDARD_LOOKUP = createLookup(STANDARD_ALPHABET);

function createLookup(alphabet: string): Uint8Array {
  const lookup = new Uint8Array(256);
  lookup.fill(255);

  for (let i = 0; i < alphabet.length; i++) {
    lookup[alphabet.charCodeAt(i)] = i;
  }

  return lookup;
}

function assertTextInputSize(input: string): ToolResult<string> {
  if (input.length > BASE64_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Text input exceeds ${BASE64_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }
  return ok(input);
}

function assertEncodedInputSize(input: string): ToolResult<string> {
  if (input.length > BASE64_MAX_ENCODED_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Base64 input exceeds ${BASE64_MAX_ENCODED_CHARS.toLocaleString()} characters.`,
    );
  }
  return ok(input);
}

function invalidBase64(urlSafe: boolean, message?: string): ToolResult<never> {
  return err(
    "INVALID_BASE64",
    message ?? (urlSafe ? "Input is not valid URL-safe Base64." : "Input is not valid Base64."),
  );
}

/**
 * Encode UTF-8 text to Base64 (standard or URL-safe).
 * Empty input → empty string (not an error).
 */
export function encodeBase64(input: string, options: Base64Options = {}): ToolResult<string> {
  const size = assertTextInputSize(input);
  if (!size.ok) return size;

  try {
    const bytes = UTF8_ENCODER.encode(input);
    if (bytes.length > BASE64_MAX_UTF8_BYTES) {
      return err(
        "INPUT_TOO_LARGE",
        `Text input exceeds ${BASE64_MAX_UTF8_BYTES.toLocaleString()} UTF-8 bytes.`,
      );
    }

    const urlSafe = options.urlSafe === true;
    const alphabet = urlSafe ? URL_SAFE_ALPHABET : STANDARD_ALPHABET;
    const encoded = bytesToBase64(bytes, alphabet, !urlSafe);
    return ok(encoded);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Failed to encode Base64.";
    return err("ENCODE_FAILED", message);
  }
}

/**
 * Decode standard or URL-safe Base64 to UTF-8 text.
 *
 * Standard Base64 requires canonical padding. URL-safe Base64 accepts omitted,
 * otherwise-canonical padding. ASCII U+0009–U+000D and U+0020 are ignored;
 * non-ASCII Unicode whitespace is rejected. In both variants, explicit padding
 * and unused bits must be canonical so malformed input is never silently repaired.
 */
export function decodeBase64(input: string, options: Base64Options = {}): ToolResult<string> {
  const size = assertEncodedInputSize(input);
  if (!size.ok) return size;

  const compact = input.replace(ASCII_BASE64_WHITESPACE_PATTERN, "");
  if (compact.length === 0) {
    return ok("");
  }

  const urlSafe = options.urlSafe === true;
  const normalized = normalizeBase64(compact, urlSafe);
  if (!normalized.ok) return normalized;

  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(normalized.value);
  } catch {
    return err("DECODE_FAILED", "Base64 decoding failed unexpectedly. Please try again.");
  }

  try {
    return ok(UTF8_DECODER.decode(bytes));
  } catch {
    return err(
      "INVALID_UTF8",
      "Base64 decoded successfully, but the payload is not valid UTF-8 text.",
    );
  }
}

/**
 * Run encode or decode by mode. Single entry for catalog/adapters.
 */
export function runBase64(
  mode: Base64Mode,
  input: string,
  options: Base64Options = {},
): ToolResult<string> {
  if (mode === "encode") return encodeBase64(input, options);
  if (mode === "decode") return decodeBase64(input, options);
  return err("INVALID_MODE", "Base64 mode must be either encode or decode.");
}

function normalizeBase64(input: string, urlSafe: boolean): ToolResult<string> {
  const pattern = urlSafe ? URL_SAFE_BASE64_PATTERN : STANDARD_BASE64_PATTERN;
  if (!pattern.test(input)) {
    return invalidBase64(urlSafe);
  }

  const firstPadding = input.indexOf("=");
  const body = firstPadding === -1 ? input : input.slice(0, firstPadding);
  const providedPadding = input.length - body.length;
  const remainder = body.length % 4;

  if (remainder === 1) {
    return invalidBase64(urlSafe, "Base64 length is invalid.");
  }

  const requiredPadding = remainder === 0 ? 0 : 4 - remainder;
  const missingUrlSafePadding = urlSafe && providedPadding === 0 && requiredPadding > 0;
  if (
    (providedPadding > 0 && input.length % 4 !== 0) ||
    (!missingUrlSafePadding && providedPadding !== requiredPadding)
  ) {
    return invalidBase64(urlSafe, "Base64 padding is invalid.");
  }

  const normalizedBody = urlSafe ? body.replace(/-/g, "+").replace(/_/g, "/") : body;

  if (requiredPadding > 0) {
    const lastValue = STANDARD_LOOKUP[normalizedBody.charCodeAt(normalizedBody.length - 1)];
    // The unused bits in the last Base64 sextet must be zero. Without this,
    // inputs such as "Zh==" decode to "f" despite not being canonical.
    if (
      lastValue === undefined ||
      (requiredPadding === 2 && (lastValue & 0x0f) !== 0) ||
      (requiredPadding === 1 && (lastValue & 0x03) !== 0)
    ) {
      return invalidBase64(urlSafe, "Base64 padding bits are invalid.");
    }
  }

  return ok(normalizedBody + "=".repeat(requiredPadding));
}

function base64OutputLength(bytesLength: number, withPadding: boolean): number {
  const completeGroups = Math.floor(bytesLength / 3);
  const remainder = bytesLength % 3;

  if (remainder === 0) return completeGroups * 4;
  return withPadding ? (completeGroups + 1) * 4 : completeGroups * 4 + remainder + 1;
}

function bytesToBase64(bytes: Uint8Array, alphabet: string, withPadding: boolean): string {
  const output = new Uint8Array(base64OutputLength(bytes.length, withPadding));
  let outputIndex = 0;

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = i + 1 < bytes.length ? (bytes[i + 1] ?? 0) : 0;
    const c = i + 2 < bytes.length ? (bytes[i + 2] ?? 0) : 0;
    const triplet = (a << 16) | (b << 8) | c;
    const remaining = bytes.length - i;

    output[outputIndex++] = alphabet.charCodeAt((triplet >> 18) & 63);
    output[outputIndex++] = alphabet.charCodeAt((triplet >> 12) & 63);
    if (remaining > 1) {
      output[outputIndex++] = alphabet.charCodeAt((triplet >> 6) & 63);
    } else if (withPadding) {
      output[outputIndex++] = "=".charCodeAt(0);
    }
    if (remaining > 2) {
      output[outputIndex++] = alphabet.charCodeAt(triplet & 63);
    } else if (withPadding) {
      output[outputIndex++] = "=".charCodeAt(0);
    }
  }

  return ASCII_DECODER.decode(output);
}

function base64ToBytes(normalized: string): Uint8Array {
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  const cleanLength = normalized.length - padding;
  const output = new Uint8Array((normalized.length / 4) * 3 - padding);
  let outputIndex = 0;

  for (let i = 0; i < cleanLength; i += 4) {
    const c0 = STANDARD_LOOKUP[normalized.charCodeAt(i)];
    const c1 = STANDARD_LOOKUP[normalized.charCodeAt(i + 1)];
    const c2 = i + 2 < cleanLength ? STANDARD_LOOKUP[normalized.charCodeAt(i + 2)] : 0;
    const c3 = i + 3 < cleanLength ? STANDARD_LOOKUP[normalized.charCodeAt(i + 3)] : 0;

    if (
      c0 === undefined ||
      c1 === undefined ||
      c2 === undefined ||
      c3 === undefined ||
      c0 === 255 ||
      c1 === 255 ||
      c2 === 255 ||
      c3 === 255
    ) {
      throw new Error("Invalid Base64 character");
    }

    const triplet = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    if (outputIndex < output.length) {
      output[outputIndex++] = (triplet >> 16) & 255;
    }
    if (outputIndex < output.length) {
      output[outputIndex++] = (triplet >> 8) & 255;
    }
    if (outputIndex < output.length) output[outputIndex++] = triplet & 255;
  }

  return output;
}
