import { describe, expect, it } from "vitest";
import { JOIN_LINES_MAX_INPUT_CHARS, joinLines } from "./join-lines";

describe("joinLines", () => {
  it("joins lines into comma-separated text by default", () => {
    expect(joinLines("a\nb\nc")).toEqual({ ok: true, value: "a, b, c" });
  });

  it("supports semicolon, pipe, whitespace, and custom delimiters", () => {
    expect(joinLines("a\nb\nc", { delimiter: "semicolon" })).toEqual({
      ok: true,
      value: "a; b; c",
    });
    expect(joinLines("a\nb\nc", { delimiter: "pipe" })).toEqual({
      ok: true,
      value: "a | b | c",
    });
    expect(joinLines("a\nb\nc", { delimiter: "whitespace" })).toEqual({
      ok: true,
      value: "a b c",
    });
    expect(joinLines("a\nb\nc", { delimiter: "custom", customDelimiter: " :: " })).toEqual({
      ok: true,
      value: "a :: b :: c",
    });
  });

  it("handles trimItems and dropEmpty options", () => {
    expect(joinLines("  a  \n\n  b  \n", { trimItems: true, dropEmpty: true })).toEqual({
      ok: true,
      value: "a, b",
    });
    expect(joinLines("  a  \n\n  b  ", { trimItems: false, dropEmpty: false })).toEqual({
      ok: true,
      value: "  a  , ,   b  ",
    });
  });

  it("rejects oversized input and invalid custom delimiter", () => {
    expect(joinLines("x".repeat(JOIN_LINES_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(joinLines("a\nb", { delimiter: "custom", customDelimiter: "x".repeat(33) }).ok).toBe(
      false,
    );
    expect(joinLines("a\nb", { delimiter: "custom", customDelimiter: "" })).toMatchObject({
      ok: false,
      error: { code: "EMPTY_DELIMITER" },
    });
  });
});
