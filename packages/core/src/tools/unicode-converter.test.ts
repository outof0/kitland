import { describe, expect, it } from "vitest";
import {
  UNICODE_CONVERTER_MAX_INPUT_CHARS,
  decodeUnicodeCodePoints,
  encodeUnicodeCodePoints,
  runUnicodeConverter,
  type UnicodeConverterMode,
} from "./unicode-converter";

describe("unicode converter", () => {
  it("formats empty input and Unicode scalar values canonically", () => {
    expect(encodeUnicodeCodePoints("")).toEqual({ ok: true, value: "" });
    expect(encodeUnicodeCodePoints("A🍵東")).toEqual({
      ok: true,
      value: "U+0041 U+1F375 U+6771",
    });
  });

  it("decodes whitespace-separated U+ notation", () => {
    expect(decodeUnicodeCodePoints(" U+0041\nU+1f375 U+6771 ")).toEqual({
      ok: true,
      value: "A🍵東",
    });
  });

  it("decodes a valid large sequence without exceeding the engine argument limit", () => {
    const count = 150_000;
    const input = Array.from({ length: count }, () => "U+0041").join(" ");

    expect(decodeUnicodeCodePoints(input)).toEqual({
      ok: true,
      value: "A".repeat(count),
    });
  });

  it.each(["0041", "U+41", "U+D800", "U+110000", "U+ZZZZ"])(
    "rejects malformed scalar values: %s",
    (input) => {
      expect(decodeUnicodeCodePoints(input).ok).toBe(false);
    },
  );

  it("rejects malformed Unicode and bounds source input", () => {
    expect(encodeUnicodeCodePoints("\ud800").ok).toBe(false);
    expect(encodeUnicodeCodePoints("x".repeat(UNICODE_CONVERTER_MAX_INPUT_CHARS + 1)).ok).toBe(
      false,
    );
  });

  it("dispatches modes", () => {
    expect(runUnicodeConverter("decode", "U+0041")).toEqual({
      ok: true,
      value: "A",
    });
    expect(runUnicodeConverter("unknown" as UnicodeConverterMode, "U+0041").ok).toBe(false);
  });
});
