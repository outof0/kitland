import { describe, expect, it } from "vitest";
import { SPLIT_TO_NEWLINES_MAX_INPUT_CHARS, splitToNewlines } from "./split-to-newlines";
import { joinLines } from "./join-lines";

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

  it("splits using whitespace and pipe delimiters", () => {
    expect(splitToNewlines("a b\tc", { delimiter: "whitespace" })).toEqual({
      ok: true,
      value: "a\nb\nc",
    });
    expect(splitToNewlines("a | b | c", { delimiter: "pipe" })).toEqual({
      ok: true,
      value: "a\nb\nc",
    });
  });

  it("roundtrips between split and join", () => {
    const original = "apple, banana, cherry";
    const split = splitToNewlines(original);
    expect(split.ok).toBe(true);
    if (!split.ok) return;
    const joined = joinLines(split.value, { delimiter: "comma" });
    expect(joined).toEqual({ ok: true, value: original });
  });
});
