import { describe, expect, it } from "vitest";
import { DEDUPE_LINES_MAX_INPUT_CHARS, DEDUPE_LINES_MAX_LINES, dedupeLines } from "./dedupe-lines";

describe("dedupeLines", () => {
  it("preserves first-occurrence order and the final line ending", () => {
    expect(dedupeLines("red\r\ngreen\r\nred\r\nblue\r\ngreen\r\n")).toEqual({
      ok: true,
      value: "red\r\ngreen\r\nblue\r\n",
    });
  });

  it("uses trim only as the matching key, not to destructively rewrite output", () => {
    expect(dedupeLines("  red\nred  \nblue", { mode: "trim" })).toEqual({
      ok: true,
      value: "  red\nblue",
    });
  });

  it("supports case-insensitive matching without changing the first spelling", () => {
    expect(dedupeLines("Éclair\néclair\nECLAIR", { caseSensitive: false })).toEqual({
      ok: true,
      value: "Éclair\nECLAIR",
    });
  });

  it("keeps the empty line when it is the first unique line", () => {
    expect(dedupeLines("\n\nvalue\n")).toEqual({ ok: true, value: "\nvalue\n" });
  });

  it("rejects invalid options and bounded input", () => {
    expect(dedupeLines("x", { mode: "collapse" as never })).toEqual({
      ok: false,
      error: { code: "INVALID_MODE", message: "Dedupe mode must be exact or trim." },
    });
    expect(dedupeLines("x".repeat(DEDUPE_LINES_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(dedupeLines("\n".repeat(DEDUPE_LINES_MAX_LINES) + "x").ok).toBe(false);
  });
});
