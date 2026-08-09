import { describe, expect, it } from "vitest";
import { generateNanoid } from "./nanoid-generator";

describe("NanoID generator", () => {
  it("generates an exact-length ID from the chosen alphabet", () => {
    const result = generateNanoid({ length: 12, alphabet: "abc" }, (length) =>
      Uint8Array.from({ length }, (_, index) => index),
    );
    expect(result).toEqual({ ok: true, value: "abcabcabcabc" });
  });
  it("rejects unsafe policies", () => {
    expect(generateNanoid({ length: 0, alphabet: "abc" }, () => new Uint8Array())).toMatchObject({
      ok: false,
      error: { code: "INVALID_LENGTH" },
    });
    expect(generateNanoid({ length: 8, alphabet: "a" }, () => new Uint8Array())).toMatchObject({
      ok: false,
      error: { code: "INVALID_ALPHABET" },
    });
  });
});
