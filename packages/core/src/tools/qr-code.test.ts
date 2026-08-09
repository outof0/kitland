import { describe, expect, it } from "vitest";
import { QR_CODE_MAX_INPUT_CHARS, validateQrPayload } from "./qr-code";

describe("validateQrPayload", () => {
  it("accepts normal text", () => {
    expect(validateQrPayload("https://kitland.dev")).toEqual({
      ok: true,
      value: { input: "https://kitland.dev", length: 19 },
    });
  });
  it("rejects empty and oversize", () => {
    expect(validateQrPayload("").ok).toBe(false);
    expect(validateQrPayload("x".repeat(QR_CODE_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });
});
