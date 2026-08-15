import { describe, expect, it } from "vitest";
import { convertNumberBase, NUMBER_BASE_MAX_INPUT_CHARS } from "./number-base";

describe("convertNumberBase", () => {
  it("converts hex to decimal and binary", () => {
    expect(convertNumberBase("FF", 16, 10)).toEqual({
      ok: true,
      value: { value: "255", fromBase: 16, toBase: 10 },
    });
    expect(convertNumberBase("10", 2, 10)).toEqual({
      ok: true,
      value: { value: "2", fromBase: 2, toBase: 10 },
    });
  });
  it("rejects bad digits and oversize", () => {
    expect(convertNumberBase("2", 2, 10).ok).toBe(false);
    expect(convertNumberBase("x".repeat(NUMBER_BASE_MAX_INPUT_CHARS + 1), 10, 16).ok).toBe(false);
  });
});
