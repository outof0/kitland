import { describe, expect, it } from "vitest";
import { SPLIT_TO_NEWLINES_MAX_INPUT_CHARS, splitToNewlines } from "./split-to-newlines";

describe("splitToNewlines", () => {
  it("splits comma lists and drops empty items by default", () => {
    expect(splitToNewlines("a, b,,c")).toEqual({ ok: true, value: "a\nb\nc" });
  });
  it("supports custom delimiters and oversize rejection", () => {
    expect(splitToNewlines("a::b", { delimiter: "custom", customDelimiter: "::" })).toEqual({
      ok: true,
      value: "a\nb",
    });
    expect(splitToNewlines("x".repeat(SPLIT_TO_NEWLINES_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });
});
