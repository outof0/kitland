import { err, ok, type ToolResult } from "../result";

export const HMAC_SHA256_ALGORITHM = "HMAC-SHA-256" as const;
export const HMAC_MAX_SECRET_CHARS = 2_000_000;
export const HMAC_MAX_MESSAGE_CHARS = 2_000_000;
export const HMAC_SHA256_BYTES = 32;

/** A host-provided native HMAC primitive for browser, extension, or editor runtimes. */
export type HmacSigner = (key: Uint8Array, message: Uint8Array) => Promise<Uint8Array>;

export type HmacResult = {
  algorithm: typeof HMAC_SHA256_ALGORITHM;
  digest: string;
  digestBytes: number;
};

/** Sign UTF-8 input with HMAC-SHA-256 and return canonical lower-case hexadecimal. */
export async function signHmacSha256(
  secret: string,
  message: string,
  sign: HmacSigner,
): Promise<ToolResult<HmacResult>> {
  if (secret.length === 0) {
    return err("SECRET_REQUIRED", "Enter a secret key before computing an HMAC.");
  }
  if (secret.length > HMAC_MAX_SECRET_CHARS) {
    return err(
      "SECRET_TOO_LARGE",
      `Secret exceeds ${HMAC_MAX_SECRET_CHARS.toLocaleString()} characters.`,
    );
  }
  if (message.length > HMAC_MAX_MESSAGE_CHARS) {
    return err(
      "MESSAGE_TOO_LARGE",
      `Message exceeds ${HMAC_MAX_MESSAGE_CHARS.toLocaleString()} characters.`,
    );
  }

  let bytes: Uint8Array;
  try {
    const encoder = new TextEncoder();
    bytes = await sign(encoder.encode(secret), encoder.encode(message));
  } catch {
    return err(
      "HMAC_UNAVAILABLE",
      "HMAC-SHA-256 is unavailable in this environment. Try a modern secure browser context.",
    );
  }

  if (!(bytes instanceof Uint8Array) || bytes.length !== HMAC_SHA256_BYTES) {
    return err(
      "INVALID_SIGNATURE",
      "The signature provider returned an invalid HMAC-SHA-256 result.",
    );
  }

  return ok({
    algorithm: HMAC_SHA256_ALGORITHM,
    digest: Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""),
    digestBytes: bytes.length,
  });
}
