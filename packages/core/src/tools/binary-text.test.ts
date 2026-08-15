import { describe, expect, it } from "vitest";
import {
  BINARY_TEXT_MAX_INPUT_CHARS,
  decodeBinaryText,
  encodeBinaryText,
  runBinaryTextTransform,
  type BinaryTextMode,
} from "./binary-text";

describe("binary text", () => {
  it("encodes empty and UTF-8 text as eight-bit groups", () => {
    expect(encodeBinaryText("")).toEqual({ ok: true, value: "" });
    expect(encodeBinaryText("A🍵")).toEqual({
      ok: true,
      value: "01000001 11110000 10011111 10001101 10110101",
    });
  });

  it("decodes whitespace-separated byte groups", () => {
    expect(decodeBinaryText("01001000\n01101001")).toEqual({
      ok: true,
      value: "Hi",
    });
  });

  it.each(["0101", "0100000x", "01000001,01000010", "11000011 00101000"])(
    "rejects malformed binary: %s",
    (input) => {
      expect(decodeBinaryText(input).ok).toBe(false);
    },
  );

  it("rejects malformed Unicode and bounded source input", () => {
    expect(encodeBinaryText("\udc00").ok).toBe(false);
    expect(encodeBinaryText("x".repeat(BINARY_TEXT_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });

  it("dispatches modes", () => {
    expect(runBinaryTextTransform("decode", "01000001")).toEqual({
      ok: true,
      value: "A",
    });
    expect(runBinaryTextTransform("unknown" as BinaryTextMode, "01000001").ok).toBe(false);
  });
});
