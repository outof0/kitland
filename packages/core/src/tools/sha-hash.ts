import { err, ok, type ToolResult } from "../result";

/** Current public SHA contract. Additional algorithms need their own vectors and UI review. */
export const SHA_HASH_ALGORITHM = "SHA-256" as const;
export const SHA_HASH_MAX_INPUT_CHARS = 2_000_000;
export const SHA_HASH_DIGEST_BYTES = 32;

export type ShaHashEncoding = "hex" | "base64" | "base64url";

/** A host-provided Web Crypto compatible digest primitive. */
export type ShaDigest = (
  algorithm: typeof SHA_HASH_ALGORITHM,
  input: Uint8Array,
) => Promise<Uint8Array>;

export type ShaHashOptions = {
  encoding?: ShaHashEncoding;
};

export type ShaHashResult = {
  algorithm: typeof SHA_HASH_ALGORITHM;
  encoding: ShaHashEncoding;
  digest: string;
  digestBytes: number;
};

/**
 * Hash UTF-8 text with SHA-256 using the injected platform cryptography API.
 * The core owns validation and deterministic encoding; hosts own the secure
 * primitive so browser, extension and editor runtimes can use native Web Crypto.
 */
export async function hashSha256(
  input: string,
  digest: ShaDigest,
  options: ShaHashOptions = {},
): Promise<ToolResult<ShaHashResult>> {
  if (input.length > SHA_HASH_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Text input exceeds ${SHA_HASH_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  const encoding = options.encoding ?? "hex";
  if (encoding !== "hex" && encoding !== "base64" && encoding !== "base64url") {
    return err("INVALID_ENCODING", "Hash output encoding must be hex, base64, or base64url.");
  }

  let bytes: Uint8Array;
  try {
    bytes = await digest(SHA_HASH_ALGORITHM, new TextEncoder().encode(input));
  } catch {
    return err(
      "DIGEST_UNAVAILABLE",
      "SHA-256 is unavailable in this environment. Try a modern secure browser context.",
    );
  }

  if (!(bytes instanceof Uint8Array) || bytes.length !== SHA_HASH_DIGEST_BYTES) {
    return err("INVALID_DIGEST", "The digest provider returned an invalid SHA-256 result.");
  }

  return ok({
    algorithm: SHA_HASH_ALGORITHM,
    encoding,
    digest: encodeDigest(bytes, encoding),
    digestBytes: bytes.length,
  });
}

function encodeDigest(bytes: Uint8Array, encoding: ShaHashEncoding): string {
  if (encoding === "hex") {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  const base64 = bytesToBase64(bytes);
  return encoding === "base64url"
    ? base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
    : base64;
}

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64(bytes: Uint8Array): string {
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const remaining = bytes.length - index;
    const group = (first << 16) | (second << 8) | third;
    output += BASE64_ALPHABET[(group >>> 18) & 63];
    output += BASE64_ALPHABET[(group >>> 12) & 63];
    output += remaining > 1 ? BASE64_ALPHABET[(group >>> 6) & 63] : "=";
    output += remaining > 2 ? BASE64_ALPHABET[group & 63] : "=";
  }
  return output;
}
