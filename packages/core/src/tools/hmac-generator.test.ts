import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  HMAC_MAX_MESSAGE_CHARS,
  HMAC_MAX_SECRET_CHARS,
  HMAC_SHA256_BYTES,
  signHmacSha256,
  type HmacSigner,
} from "./hmac-generator";

const nodeSigner: HmacSigner = async (key, message) =>
  new Uint8Array(createHmac("sha256", key).update(message).digest());

describe("signHmacSha256", () => {
  it("matches the RFC 4231 HMAC-SHA-256 test vector", async () => {
    await expect(
      signHmacSha256("Jefe", "what do ya want for nothing?", nodeSigner),
    ).resolves.toEqual({
      ok: true,
      value: {
        algorithm: "HMAC-SHA-256",
        digest: "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
        digestBytes: HMAC_SHA256_BYTES,
      },
    });
  });

  it("signs UTF-8 secret and message bytes", async () => {
    await expect(signHmacSha256("trà", "🍵", nodeSigner)).resolves.toMatchObject({
      ok: true,
      value: { digest: "559c344b2b89db1e32eb3731d05ede3fb48a56ebc87e2f721315bb1cc65809df" },
    });
  });

  it("rejects empty/oversized inputs and invalid signer responses", async () => {
    await expect(signHmacSha256("", "message", nodeSigner)).resolves.toMatchObject({
      ok: false,
      error: { code: "SECRET_REQUIRED" },
    });
    await expect(
      signHmacSha256("x".repeat(HMAC_MAX_SECRET_CHARS + 1), "m", nodeSigner),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "SECRET_TOO_LARGE" },
    });
    await expect(
      signHmacSha256("k", "x".repeat(HMAC_MAX_MESSAGE_CHARS + 1), nodeSigner),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "MESSAGE_TOO_LARGE" },
    });
    await expect(signHmacSha256("k", "m", async () => new Uint8Array(1))).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_SIGNATURE" },
    });
  });
});
