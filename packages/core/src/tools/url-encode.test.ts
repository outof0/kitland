import { describe, expect, it } from "vitest";
import {
  URL_TRANSFORM_MAX_INPUT_CHARS,
  decodeUrl,
  encodeUrl,
  runUrlTransform,
  type UrlEncodingScope,
  type UrlTransformMode,
} from "./url-encode";

describe("encodeUrl", () => {
  it("percent-encodes a URL component including URI delimiters", () => {
    expect(encodeUrl("hello world/?x=1&tag=✓")).toEqual({
      ok: true,
      value: "hello%20world%2F%3Fx%3D1%26tag%3D%E2%9C%93",
    });
  });

  it("retains URI structure in full-URL mode", () => {
    expect(
      encodeUrl("https://example.test/a path?q=tea&tag=✓#top", {
        scope: "url",
      }),
    ).toEqual({
      ok: true,
      value: "https://example.test/a%20path?q=tea&tag=%E2%9C%93#top",
    });
  });

  it("encodes Unicode as UTF-8 and round-trips it", () => {
    const input = "café 🍵 東京";
    const encoded = encodeUrl(input);

    expect(encoded).toEqual({
      ok: true,
      value: "caf%C3%A9%20%F0%9F%8D%B5%20%E6%9D%B1%E4%BA%AC",
    });
    if (!encoded.ok) throw new Error("Expected URL encoding to succeed.");
    expect(decodeUrl(encoded.value)).toEqual({ ok: true, value: input });
  });

  it("does not apply application/x-www-form-urlencoded plus handling", () => {
    expect(encodeUrl("a+b c")).toEqual({ ok: true, value: "a%2Bb%20c" });
  });

  it("reports unpaired Unicode surrogates without replacing them", () => {
    expect(encodeUrl("before\ud800after")).toEqual({
      ok: false,
      error: {
        code: "INVALID_UNICODE",
        message: "Text contains an unpaired Unicode surrogate and cannot be percent-encoded.",
      },
    });
  });

  it("rejects invalid runtime scopes instead of silently treating them as components", () => {
    expect(encodeUrl("https://example.test/a", { scope: "other" as UrlEncodingScope })).toEqual({
      ok: false,
      error: {
        code: "INVALID_SCOPE",
        message: "URL scope must be either component or url.",
      },
    });
  });
});

describe("decodeUrl", () => {
  it("decodes a component including escaped URI syntax", () => {
    expect(decodeUrl("a%2Fb%3Fc%3D1%26d%23top")).toEqual({
      ok: true,
      value: "a/b?c=1&d#top",
    });
  });

  it("preserves escaped URI delimiters in full-URL mode", () => {
    expect(
      decodeUrl("https://example.test/a%2Fb%3Fq%3Dtea%26n%3D1", {
        scope: "url",
      }),
    ).toEqual({
      ok: true,
      value: "https://example.test/a%2Fb%3Fq%3Dtea%26n%3D1",
    });
  });

  it("retains literal plus characters", () => {
    expect(decodeUrl("a+b%20c")).toEqual({ ok: true, value: "a+b c" });
  });

  it.each(["%", "%2", "%GG", "%E0%A4%A", "%C3%28"])(
    "rejects malformed percent or UTF-8 input: %s",
    (input) => {
      expect(decodeUrl(input)).toEqual({
        ok: false,
        error: {
          code: "INVALID_PERCENT_ENCODING",
          message: "Input contains malformed percent escapes or invalid UTF-8 byte sequences.",
        },
      });
    },
  );

  it("enforces the same input bound while decoding", () => {
    const oversized = "%".repeat(URL_TRANSFORM_MAX_INPUT_CHARS + 1);
    expect(decodeUrl(oversized)).toEqual({
      ok: false,
      error: {
        code: "INPUT_TOO_LARGE",
        message: `URL input exceeds ${URL_TRANSFORM_MAX_INPUT_CHARS.toLocaleString()} characters.`,
      },
    });
  });

  it("rejects invalid runtime scopes while decoding", () => {
    expect(decodeUrl("a%20b", { scope: "other" as UrlEncodingScope })).toEqual({
      ok: false,
      error: {
        code: "INVALID_SCOPE",
        message: "URL scope must be either component or url.",
      },
    });
  });
});

describe("runUrlTransform", () => {
  it("dispatches to the selected operation", () => {
    expect(runUrlTransform("encode", "a b")).toEqual(encodeUrl("a b"));
    expect(runUrlTransform("decode", "a%20b")).toEqual(decodeUrl("a%20b"));
  });

  it("rejects unsupported modes", () => {
    expect(runUrlTransform("unknown" as UrlTransformMode, "a b")).toEqual({
      ok: false,
      error: {
        code: "INVALID_MODE",
        message: "URL mode must be either encode or decode.",
      },
    });
  });

  it("bounds input before native processing", () => {
    const oversized = "x".repeat(URL_TRANSFORM_MAX_INPUT_CHARS + 1);
    expect(encodeUrl(oversized)).toEqual({
      ok: false,
      error: {
        code: "INPUT_TOO_LARGE",
        message: `URL input exceeds ${URL_TRANSFORM_MAX_INPUT_CHARS.toLocaleString()} characters.`,
      },
    });
  });
});
