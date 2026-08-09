import { describe, expect, it } from "vitest";
import { SORT_LINES_MAX_INPUT_CHARS, SORT_LINES_MAX_LINES, sortLines } from "./sort-lines";

describe("sortLines", () => {
  it("sorts ascending while retaining a final CRLF", () => {
    expect(sortLines("banana\r\napple\r\ncherry\r\n")).toEqual({
      ok: true,
      value: "apple\r\nbanana\r\ncherry\r\n",
    });
  });

  it("sorts descending with explicit numeric comparison", () => {
    expect(sortLines("item10\nitem2\nitem1", { direction: "descending", numeric: true })).toEqual({
      ok: true,
      value: "item10\nitem2\nitem1",
    });
  });

  it("is stable for equal comparison keys", () => {
    const options = { caseSensitive: false };
    expect(sortLines("Beta\nbeta\nALPHA\nalpha", options)).toEqual({
      ok: true,
      value: "ALPHA\nalpha\nBeta\nbeta",
    });
  });

  it("sorts accented Unicode text without corrupting it", () => {
    const result = sortLines("zèbre\néclair\nétude");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("éclair");
    expect(result.value.split("\n")).toHaveLength(3);
  });

  it("rejects invalid runtime direction and bounded oversize input", () => {
    expect(sortLines("a", { direction: "sideways" as never })).toEqual({
      ok: false,
      error: {
        code: "INVALID_DIRECTION",
        message: "Sort direction must be ascending or descending.",
      },
    });
    expect(sortLines("x".repeat(SORT_LINES_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });

  it("rejects documents with too many lines", () => {
    expect(sortLines("\n".repeat(SORT_LINES_MAX_LINES) + "x").ok).toBe(false);
  });
});
