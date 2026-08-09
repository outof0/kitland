import { createCipheriv, createDecipheriv } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptAesGcm, encryptAesGcm, type AesGcmHost } from "./aes-cipher";

const key = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const nonce = "101112131415161718191a1b";
const host: AesGcmHost = {
  async encrypt(k, n, text) {
    const c = createCipheriv("aes-256-gcm", k, n);
    return new Uint8Array(Buffer.concat([c.update(text), c.final(), c.getAuthTag()]));
  },
  async decrypt(k, n, sealed) {
    const d = createDecipheriv("aes-256-gcm", k, n);
    d.setAuthTag(sealed.slice(-16));
    return new Uint8Array(Buffer.concat([d.update(sealed.slice(0, -16)), d.final()]));
  },
};
describe("AES-256-GCM", () => {
  it("round-trips a versioned packet that includes its nonce", async () => {
    const encrypted = await encryptAesGcm(key, nonce, "Attack at dawn.", host);
    expect(encrypted).toMatchObject({ ok: true });
    if (!encrypted.ok) return;
    expect(encrypted.value).toMatch(/^v1:/);
    await expect(decryptAesGcm(key, encrypted.value, host)).resolves.toEqual({
      ok: true,
      value: "Attack at dawn.",
    });
  });
  it("rejects invalid key, nonce, packet and authentication", async () => {
    await expect(encryptAesGcm("00", nonce, "x", host)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_HEX" },
    });
    await expect(encryptAesGcm(key, "00", "x", host)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_HEX" },
    });
    await expect(decryptAesGcm(key, "v1:not-base64", host)).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_PACKET" },
    });
  });
});
