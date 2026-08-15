import { describe, expect, it } from "vitest";
import { pem, validateRsaOptions } from "./rsa-key-pair";
describe("rsa helpers", () => {
  it("validates modulus and creates PEM", () => {
    expect(validateRsaOptions(2048).ok).toBe(true);
    expect(validateRsaOptions(1024)).toMatchObject({ ok: false });
    expect(pem("PUBLIC KEY", new Uint8Array([1, 2, 3]).buffer)).toContain("BEGIN PUBLIC KEY");
  });
});
