import { describe, expect, it } from "vitest";
import {
  JSON_ESCAPE_MAX_ENCODED_CHARS,
  JSON_ESCAPE_MAX_INPUT_CHARS,
  escapeJson,
  runJsonEscape,
  unescapeJson,
} from "./json-escape";

describe("json escape", () => {
  it("encodes quotes, controls, and backslashes as a JSON string literal", () => {
    expect(escapeJson('line 1\n"quoted"\\tab\t')).toEqual({
      ok: true,
      value: '"line 1\\n\\"quoted\\"\\\\tab\\t"',
    });
  });

  it("round-trips Unicode text, including emoji and lone surrogates", () => {
    const source = "cà phê 🍵\uD800";
    const encoded = escapeJson(source);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(encoded.value).toContain("\\ud800");
    expect(unescapeJson(encoded.value)).toEqual({ ok: true, value: source });
  });

  it("requires the decode input to be a JSON string, not any JSON value", () => {
    expect(unescapeJson("42")).toEqual({
      ok: false,
      error: {
        code: "JSON_STRING_REQUIRED",
        message: "Input must be a JSON string literal, not another JSON value.",
      },
    });
    expect(unescapeJson('{"value":true}').ok).toBe(false);
  });

  it("reports malformed JSON string literals without repairing them", () => {
    const result = unescapeJson('"unterminated');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("INVALID_JSON_STRING");
  });

  it("bounds decoded output even when the encoded literal is within its limit", () => {
    const oversizedDecoded = JSON.stringify("a".repeat(JSON_ESCAPE_MAX_INPUT_CHARS + 1));
    expect(unescapeJson(oversizedDecoded)).toMatchObject({
      ok: false,
      error: { code: "OUTPUT_TOO_LARGE" },
    });
  });

  it("bounds both directions before parsing or allocating output", () => {
    const oversizedText = "x".repeat(JSON_ESCAPE_MAX_INPUT_CHARS + 1);
    expect(escapeJson(oversizedText)).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
    const oversizedLiteral = `"${"x".repeat(JSON_ESCAPE_MAX_ENCODED_CHARS)}"`;
    expect(unescapeJson(oversizedLiteral)).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
  });

  it("dispatches both modes and rejects unknown modes at the boundary", () => {
    expect(runJsonEscape("encode", "hello")).toEqual({ ok: true, value: '"hello"' });
    expect(runJsonEscape("decode", '"hello"')).toEqual({ ok: true, value: "hello" });
    expect(runJsonEscape("other" as never, "hello")).toMatchObject({
      ok: false,
      error: { code: "INVALID_MODE" },
    });
  });
});
