import { describe, expect, it } from "vitest";
import { diffText, TEXT_DIFF_MAX_LINES, TEXT_DIFF_MAX_MATRIX_CELLS } from "./text-diff";

describe("diffText", () => {
  it("returns an empty diff for two empty documents", () => {
    expect(diffText("", "")).toEqual({
      ok: true,
      value: { equal: true, added: 0, removed: 0, unchanged: 0, lines: [] },
    });
  });

  it("produces deterministic, line-numbered changes and preserves Unicode", () => {
    const result = diffText("one\n🍵\nthree", "one\n東京\nthree\nfour");
    expect(result).toEqual({
      ok: true,
      value: {
        equal: false,
        added: 2,
        removed: 1,
        unchanged: 2,
        lines: [
          { kind: "equal", value: "one", oldLine: 1, newLine: 1 },
          { kind: "removed", value: "🍵", oldLine: 2, newLine: null },
          { kind: "added", value: "東京", oldLine: null, newLine: 2 },
          { kind: "equal", value: "three", oldLine: 3, newLine: 3 },
          { kind: "added", value: "four", oldLine: null, newLine: 4 },
        ],
      },
    });
  });

  it("accepts equivalent CRLF and LF line endings", () => {
    expect(diffText("a\r\nb", "a\nb")).toEqual({
      ok: true,
      value: {
        equal: true,
        added: 0,
        removed: 0,
        unchanged: 2,
        lines: [
          { kind: "equal", value: "a", oldLine: 1, newLine: 1 },
          { kind: "equal", value: "b", oldLine: 2, newLine: 2 },
        ],
      },
    });
  });

  it("rejects line and matrix complexity limits", () => {
    const tooManyLines = Array.from({ length: TEXT_DIFF_MAX_LINES + 1 }, () => "x").join("\n");
    expect(diffText(tooManyLines, "").ok).toBe(false);

    const side = Math.floor(Math.sqrt(TEXT_DIFF_MAX_MATRIX_CELLS)) + 2;
    const before = Array.from({ length: side }, (_, index) => `before-${index}`).join("\n");
    const after = Array.from({ length: side }, (_, index) => `after-${index}`).join("\n");
    expect(diffText(before, after).ok).toBe(false);
  });
});
