import { describe, expect, it } from "vitest";
import {
  BASE64_MAX_ENCODED_CHARS,
  BASE64_MAX_INPUT_CHARS,
  BASE64_MAX_UTF8_BYTES,
  decodeBase64,
  encodeBase64,
  runBase64,
  type Base64Mode,
} from "./base64";

describe("encodeBase64", () => {
  it("encodes empty string to empty string", () => {
    expect(encodeBase64("")).toEqual({ ok: true, value: "" });
  });

  it("encodes plain ASCII", () => {
    expect(encodeBase64("hello")).toEqual({ ok: true, value: "aGVsbG8=" });
  });

  it("encodes Unicode (UTF-8)", () => {
    const result = encodeBase64("café 🍵");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const roundTrip = decodeBase64(result.value);
    expect(roundTrip).toEqual({ ok: true, value: "café 🍵" });
  });

  it("preserves a leading byte-order-mark character during a round-trip", () => {
    const input = "\uFEFFhello";
    const encoded = encodeBase64(input);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(decodeBase64(encoded.value)).toEqual({ ok: true, value: input });
  });

  it.each(["\uD800", "\uDC00"])(
    "uses TextEncoder replacement semantics for an unpaired surrogate",
    (input) => {
      expect(encodeBase64(input)).toEqual({ ok: true, value: "77+9" });
    },
  );

  it("encodes URL-safe without padding", () => {
    const result = encodeBase64("subjects?_d", { urlSafe: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toContain("+");
    expect(result.value).not.toContain("/");
    expect(result.value).not.toContain("=");
  });

  it("publishes byte and encoded caps that cover worst-case UTF-8 expansion", () => {
    expect(BASE64_MAX_UTF8_BYTES).toBe(BASE64_MAX_INPUT_CHARS * 3);
    expect(BASE64_MAX_ENCODED_CHARS).toBe(4 * Math.ceil(BASE64_MAX_UTF8_BYTES / 3));
  });

  it("round-trips a maximum-size ASCII source whose output exceeds the source cap", () => {
    const input = "x".repeat(BASE64_MAX_INPUT_CHARS);
    const encoded = encodeBase64(input);

    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(encoded.value.length).toBe(4 * Math.ceil(BASE64_MAX_INPUT_CHARS / 3));
    expect(encoded.value.length).toBeGreaterThan(BASE64_MAX_INPUT_CHARS);
    expect(encoded.value.length).toBeLessThanOrEqual(BASE64_MAX_ENCODED_CHARS);
    expect(decodeBase64(encoded.value)).toEqual({ ok: true, value: input });
  });

  it("rejects oversized source text", () => {
    const huge = "x".repeat(BASE64_MAX_INPUT_CHARS + 1);
    const result = encodeBase64(huge);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INPUT_TOO_LARGE");
  });
});

describe("decodeBase64", () => {
  it("decodes empty / whitespace to empty string", () => {
    expect(decodeBase64("")).toEqual({ ok: true, value: "" });
    expect(decodeBase64("  \n\t  ")).toEqual({ ok: true, value: "" });
  });

  it("decodes standard Base64", () => {
    expect(decodeBase64("aGVsbG8=")).toEqual({ ok: true, value: "hello" });
  });

  it.each([
    { label: "U+0009", value: "\t" },
    { label: "U+000A", value: "\n" },
    { label: "U+000B", value: "\v" },
    { label: "U+000C", value: "\f" },
    { label: "U+000D", value: "\r" },
    { label: "U+0020", value: " " },
  ])("accepts ASCII formatting whitespace $label inside a payload", ({ value }) => {
    expect(decodeBase64(`aGVs${value}bG8=`)).toEqual({ ok: true, value: "hello" });
  });

  it.each([
    { label: "U+00A0", value: String.fromCodePoint(0x00a0) },
    { label: "U+2003", value: String.fromCodePoint(0x2003) },
    { label: "U+2028", value: String.fromCodePoint(0x2028) },
    { label: "U+2029", value: String.fromCodePoint(0x2029) },
    { label: "U+FEFF", value: String.fromCodePoint(0xfeff) },
  ])("rejects non-ASCII Unicode whitespace $label", ({ value }) => {
    const result = decodeBase64(`aGVs${value}bG8=`);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_BASE64");
  });

  it("accepts raw input exactly at the encoded-input cap", () => {
    expect(decodeBase64(" ".repeat(BASE64_MAX_ENCODED_CHARS))).toEqual({
      ok: true,
      value: "",
    });
  });

  it("distinguishes valid Base64 containing non-UTF-8 bytes", () => {
    expect(decodeBase64("/w==")).toEqual({
      ok: false,
      error: {
        code: "INVALID_UTF8",
        message: "Base64 decoded successfully, but the payload is not valid UTF-8 text.",
      },
    });
  });

  it("requires canonical padding for standard Base64", () => {
    expect(decodeBase64("TQ").ok).toBe(false);
    expect(decodeBase64("TWE").ok).toBe(false);
    expect(decodeBase64("TQ==")).toEqual({ ok: true, value: "M" });
    expect(decodeBase64("TWE=")).toEqual({ ok: true, value: "Ma" });
    expect(decodeBase64("TWFu")).toEqual({ ok: true, value: "Man" });
  });

  it("decodes URL-safe alphabet with or without canonical padding", () => {
    expect(decodeBase64("8J-SqQ", { urlSafe: true })).toEqual({
      ok: true,
      value: "💩",
    });
    expect(decodeBase64("8J-SqQ==", { urlSafe: true })).toEqual({
      ok: true,
      value: "💩",
    });
  });

  it("rejects an alphabet from the other Base64 variant", () => {
    expect(decodeBase64("8J-SqQ").ok).toBe(false);
    expect(decodeBase64("8J+SqQ==", { urlSafe: true }).ok).toBe(false);
  });

  it.each(["==", "Zg=", "Zg===", "A===", "T=Q=", "A"])(
    "rejects malformed padding or length: %s",
    (input) => {
      const result = decodeBase64(input);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_BASE64");
    },
  );

  it.each(["Zh==", "Zm9="])("rejects noncanonical unused bits: %s", (input) => {
    const result = decodeBase64(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_BASE64");
  });

  it.each(["Zh", "Zm9"])(
    "rejects noncanonical unused bits in URL-safe unpadded input: %s",
    (input) => {
      const result = decodeBase64(input, { urlSafe: true });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe("INVALID_BASE64");
    },
  );

  it("rejects invalid characters", () => {
    const result = decodeBase64("@@@@");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_BASE64");
  });

  it("rejects encoded input above the independent decode cap", () => {
    const oversized = "A".repeat(BASE64_MAX_ENCODED_CHARS + 1);
    const result = decodeBase64(oversized);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INPUT_TOO_LARGE");
  });
});

describe("runBase64", () => {
  it("dispatches encode and decode", () => {
    expect(runBase64("encode", "hi")).toEqual(encodeBase64("hi"));
    expect(runBase64("decode", "aGk=")).toEqual(decodeBase64("aGk="));
  });

  it("rejects an invalid runtime mode instead of silently decoding", () => {
    const result = runBase64("unexpected" as Base64Mode, "aGk=");
    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_MODE",
        message: "Base64 mode must be either encode or decode.",
      },
    });
  });
});
