import { describe, expect, it } from "vitest";
import {
  TEXT_REVERSER_MAX_INPUT_CHARS,
  reverseText,
  type TextReverseCase,
  type TextReverseMode,
} from "./text-reverser";

describe("reverseText", () => {
  it("reverses by grapheme cluster rather than UTF-16 code unit", () => {
    expect(reverseText("A👨‍👩‍👧‍👦e\u0301", { mode: "characters" })).toEqual({
      ok: true,
      value: "e\u0301👨‍👩‍👧‍👦A",
    });
  });

  it("reverses word order while retaining whitespace placement", () => {
    expect(reverseText("  one\t two   three ", { mode: "word-order" })).toEqual({
      ok: true,
      value: "  three\t two   one ",
    });
  });

  it("reverses each word by graphemes and preserves the final CRLF for line order", () => {
    expect(reverseText("café 🍵", { mode: "word-characters" })).toEqual({
      ok: true,
      value: "éfac 🍵",
    });
    expect(reverseText("first\r\nsecond\r\n", { mode: "line-order" })).toEqual({
      ok: true,
      value: "second\r\nfirst\r\n",
    });
  });

  it("applies the requested output case after reversing", () => {
    expect(reverseText("Ab cD", { mode: "word-order", case: "lower" })).toEqual({
      ok: true,
      value: "cd ab",
    });
  });

  it("rejects invalid runtime options and oversize input", () => {
    expect(reverseText("x", { mode: "none" as TextReverseMode })).toEqual({
      ok: false,
      error: { code: "INVALID_MODE", message: "Choose a supported reverse mode." },
    });
    expect(reverseText("x", { case: "mixed" as TextReverseCase })).toEqual({
      ok: false,
      error: { code: "INVALID_CASE", message: "Choose keep, upper, or lower case." },
    });
    expect(reverseText("x".repeat(TEXT_REVERSER_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });
});
