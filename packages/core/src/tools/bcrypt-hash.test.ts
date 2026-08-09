import { describe, expect, it } from "vitest";
import { BCRYPT_MAX_INPUT_BYTES, validateBcryptRequest } from "./bcrypt-hash";
describe("bcrypt validation", () => {
  it("uses UTF-8 byte limit and cost bounds", () => {
    expect(validateBcryptRequest("a", 10)).toEqual({ ok: true, value: undefined });
    expect(validateBcryptRequest("", 10)).toMatchObject({
      ok: false,
      error: { code: "PASSWORD_REQUIRED" },
    });
    expect(validateBcryptRequest("🍵".repeat(19), 10)).toMatchObject({
      ok: false,
      error: { code: "PASSWORD_TOO_LONG" },
    });
    expect(validateBcryptRequest("a", 15)).toMatchObject({
      ok: false,
      error: { code: "INVALID_COST" },
    });
    expect(BCRYPT_MAX_INPUT_BYTES).toBe(72);
  });
});
