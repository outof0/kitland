import { BASE64_MAX_ENCODED_CHARS, BASE64_MAX_INPUT_CHARS } from "@kitland/core";
import { describe, expect, it } from "vitest";
import {
  SAMPLE_INPUT,
  canTransferResult,
  decodeUtf8File,
  formatBytes,
  inputCharacterLimit,
  runTransform,
} from "../src/tools/base64/domain";

describe("Base64 reference adapter domain", () => {
  it("reuses the shared core for standard UTF-8 round trips", () => {
    const encoded = runTransform({ mode: "encode", format: "standard", input: "Kitland ✓" });
    expect(encoded.result).toEqual({ ok: true, value: "S2l0bGFuZCDinJM=" });
    expect(encoded.outputByteLength).toBe(16);

    const decoded = runTransform({
      mode: "decode",
      format: "standard",
      input: "S2l0bGFuZCDinJM=",
    });
    expect(decoded.result).toEqual({ ok: true, value: "Kitland ✓" });
    expect(decoded.outputByteLength).toBe(11);
  });

  it("supports unpadded URL-safe Base64", () => {
    const encoded = runTransform({ mode: "encode", format: "url-safe", input: "💩" });
    expect(encoded.result).toEqual({ ok: true, value: "8J-SqQ" });
    expect(runTransform({ mode: "decode", format: "url-safe", input: "8J-SqQ" }).result).toEqual({
      ok: true,
      value: "💩",
    });
  });

  it("surfaces shared validation errors", () => {
    const invalid = runTransform({ mode: "decode", format: "standard", input: "@@@" });
    expect(invalid.result.ok).toBe(false);
    if (invalid.result.ok) return;
    expect(invalid.result.error.code).toBe("INVALID_BASE64");
  });

  it("uses direction-specific limits when transferring a result", () => {
    expect(inputCharacterLimit("encode")).toBe(BASE64_MAX_INPUT_CHARS);
    expect(inputCharacterLimit("decode")).toBe(BASE64_MAX_ENCODED_CHARS);
    expect(canTransferResult("encode", SAMPLE_INPUT)).toBe(true);
    expect(canTransferResult("encode", "x".repeat(BASE64_MAX_INPUT_CHARS + 1))).toBe(false);
  });

  it("decodes UTF-8 file bytes strictly and preserves a leading BOM", () => {
    const valid = new TextEncoder().encode("\uFEFFhello").buffer;
    expect(decodeUtf8File(valid)).toEqual({ ok: true, value: "\uFEFFhello" });

    const invalid = new Uint8Array([0xc3, 0x28]).buffer;
    const result = decodeUtf8File(invalid);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_UTF8");
  });

  it("formats result size labels without platform APIs", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});
