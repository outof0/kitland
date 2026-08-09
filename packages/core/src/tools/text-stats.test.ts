import { describe, expect, it } from "vitest";
import { getTextStats, TEXT_STATS_MAX_INPUT_CHARS } from "./text-stats";

describe("getTextStats", () => {
  it("reports an empty document without inventing a line", () => {
    expect(getTextStats("")).toEqual({
      ok: true,
      value: {
        graphemes: 0,
        codePoints: 0,
        words: 0,
        lines: 0,
        charactersWithWhitespace: 0,
        charactersWithoutWhitespace: 0,
        utf8Bytes: 0,
      },
    });
  });

  it("measures Unicode graphemes, code points, words, lines, and bytes", () => {
    const result = getTextStats("cafe\u0301 🍵\r\n東京");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      graphemes: 9,
      codePoints: 11,
      words: 2,
      lines: 2,
      charactersWithWhitespace: 12,
      charactersWithoutWhitespace: 9,
      utf8Bytes: 19,
    });
  });

  it("rejects malformed Unicode and oversized input", () => {
    expect(getTextStats("\ud800").ok).toBe(false);
    expect(getTextStats("x".repeat(TEXT_STATS_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });
});
