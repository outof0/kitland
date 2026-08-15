import { describe, expect, it } from "vitest";
import {
  ROT13_CAESAR_MAX_INPUT_CHARS,
  rotateCaesar,
  runRot13Caesar,
  type Rot13CaesarMode,
} from "./rot13-caesar";

describe("ROT13 / Caesar", () => {
  it("rotates ASCII letters while preserving case, punctuation, and Unicode", () => {
    expect(runRot13Caesar("encode", "Hello, World! 🍵")).toEqual({
      ok: true,
      value: "Uryyb, Jbeyq! 🍵",
    });
    expect(runRot13Caesar("decode", "Uryyb, Jbeyq! 🍵")).toEqual({
      ok: true,
      value: "Hello, World! 🍵",
    });
  });

  it("supports bounded reusable Caesar shifts", () => {
    expect(rotateCaesar("Zebra", 1)).toEqual({ ok: true, value: "Afcsb" });
    expect(rotateCaesar("Abc", 0)).toEqual({ ok: true, value: "Abc" });
  });

  it("rejects invalid runtime input options and oversize text", () => {
    expect(rotateCaesar("text", -1)).toEqual({
      ok: false,
      error: {
        code: "INVALID_SHIFT",
        message: "Caesar shift must be a whole number from 0 to 25.",
      },
    });
    expect(runRot13Caesar("other" as Rot13CaesarMode, "text")).toEqual({
      ok: false,
      error: { code: "INVALID_MODE", message: "Choose ROT13 encode or decode mode." },
    });
    expect(runRot13Caesar("encode", "x".repeat(ROT13_CAESAR_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });
});
