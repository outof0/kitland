import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  hashSha256,
  SHA_HASH_DIGEST_BYTES,
  SHA_HASH_MAX_INPUT_CHARS,
  type ShaDigest,
} from "./sha-hash";

const nodeDigest: ShaDigest = async (_algorithm, input) =>
  new Uint8Array(createHash("sha256").update(input).digest());

describe("hashSha256", () => {
  it("matches the SHA-256 test vector and emits lower-case hex by default", async () => {
    await expect(hashSha256("hello world", nodeDigest)).resolves.toEqual({
      ok: true,
      value: {
        algorithm: "SHA-256",
        encoding: "hex",
        digest: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
        digestBytes: SHA_HASH_DIGEST_BYTES,
      },
    });
  });

  it("encodes the same digest as padded base64 or unpadded base64url", async () => {
    const base64 = await hashSha256("hello world", nodeDigest, { encoding: "base64" });
    const base64url = await hashSha256("hello world", nodeDigest, { encoding: "base64url" });

    expect(base64).toMatchObject({
      ok: true,
      value: { digest: "uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=" },
    });
    expect(base64url).toMatchObject({
      ok: true,
      value: { digest: "uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek" },
    });
  });

  it("rejects oversized input, malformed options, unavailable and malformed providers", async () => {
    await expect(
      hashSha256("x".repeat(SHA_HASH_MAX_INPUT_CHARS + 1), nodeDigest),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
    await expect(
      hashSha256("x", nodeDigest, { encoding: "binary" as never }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_ENCODING" },
    });
    await expect(
      hashSha256("x", async () => {
        throw new Error("no crypto");
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "DIGEST_UNAVAILABLE" },
    });
    await expect(hashSha256("x", async () => new Uint8Array(1))).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_DIGEST" },
    });
  });
});
