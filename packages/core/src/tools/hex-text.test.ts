import { describe, expect, it } from "vitest";
import {
  HEX_TEXT_MAX_INPUT_CHARS,
  decodeHexText,
  encodeHexText,
  runHexTextTransform,
  type HexTextMode,
} from "./hex-text";

describe("hex text", () => {
  it("encodes empty and UTF-8 text deterministically", () => {
    expect(encodeHexText("")).toEqual({ ok: true, value: "" });
    expect(encodeHexText("Hi 🍵")).toEqual({
      ok: true,
      value: "48 69 20 f0 9f 8d b5",
    });
    expect(encodeHexText("Hi", { format: "compact" })).toEqual({
      ok: true,
      value: "4869",
    });
  });

  it("decodes compact or whitespace-formatted hexadecimal", () => {
    expect(decodeHexText("48 69\n f0 9f 8d b5")).toEqual({
      ok: true,
      value: "Hi🍵",
    });
    expect(decodeHexText("4869")).toEqual({ ok: true, value: "Hi" });
  });

  it.each(["f", "0x48", "gg", "c3 28"])("rejects invalid text: %s", (input) => {
    expect(decodeHexText(input).ok).toBe(false);
  });

  it("rejects malformed Unicode and bounded source input", () => {
    expect(encodeHexText("\udc00").ok).toBe(false);
    expect(encodeHexText("x".repeat(HEX_TEXT_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });

  it("dispatches modes", () => {
    expect(runHexTextTransform("decode", "41")).toEqual({
      ok: true,
      value: "A",
    });
    expect(runHexTextTransform("unknown" as HexTextMode, "41").ok).toBe(false);
  });
});
