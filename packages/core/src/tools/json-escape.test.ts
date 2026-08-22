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

  it("supports wrapQuotes: false option to omit outer quotes", () => {
    expect(escapeJson('hello "world"', { wrapQuotes: false })).toEqual({
      ok: true,
      value: 'hello \\"world\\"',
    });
    expect(escapeJson("line 1\nline 2", { wrapQuotes: false })).toEqual({
      ok: true,
      value: "line 1\\nline 2",
    });
  });

  it("supports escapeSlashes option to escape forward slashes", () => {
    expect(escapeJson("<script>/api/data</script>", { escapeSlashes: true })).toEqual({
      ok: true,
      value: '"<script>\\/api\\/data<\\/script>"',
    });
    expect(
      escapeJson("https://example.com/a/b", { escapeSlashes: true, wrapQuotes: false }),
    ).toEqual({
      ok: true,
      value: "https:\\/\\/example.com\\/a\\/b",
    });
  });

  it("supports escapeUnicode option to escape non-ASCII characters and surrogate pairs", () => {
    const source = "cà phê 🍵";
    const res = escapeJson(source, { escapeUnicode: true });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value).toBe('"c\\u00e0 ph\\u00ea \\ud83c\\udf75"');
    expect(unescapeJson(res.value)).toEqual({ ok: true, value: source });
  });

  it("round-trips Unicode text, including emoji and lone surrogates", () => {
    const source = "cà phê 🍵\uD800";
    const encoded = escapeJson(source);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(encoded.value).toContain("\\ud800");
    expect(unescapeJson(encoded.value)).toEqual({ ok: true, value: source });
  });

  it("unescapes quoted JSON string literals with surrounding double or single quotes", () => {
    expect(unescapeJson('"Hello \\"world\\"\\nLine 2"')).toEqual({
      ok: true,
      value: 'Hello "world"\nLine 2',
    });
    expect(unescapeJson("'Hello \\'world\\'\\nLine 2'")).toEqual({
      ok: true,
      value: "Hello 'world'\nLine 2",
    });
    expect(runJsonEscape("decode", '"hello"', { unwrapQuotes: false })).toEqual({
      ok: true,
      value: '"hello"',
    });
  });

  it("unescapes unquoted escaped JSON documents copied directly from logs or code", () => {
    const unquotedLog = '{\\"name\\": \\"Alice\\", \\"age\\": 30, \\"active\\": true}';
    expect(unescapeJson(unquotedLog)).toEqual({
      ok: true,
      value: '{"name": "Alice", "age": 30, "active": true}',
    });
  });

  it("unescapes multiline strings with real and escaped newlines and tabs", () => {
    const multiline = '{\n  \\"id\\": 101,\n  \\"note\\": \\"First line\\nSecond line\\"\n}';
    expect(unescapeJson(multiline)).toEqual({
      ok: true,
      value: '{\n  "id": 101,\n  "note": "First line\nSecond line"\n}',
    });
  });

  it("unescapes double-escaped strings progressively", () => {
    const doubleEscaped = '{\\\\\\"title\\\\\\": \\\\\\"Test\\\\\\"}';
    const firstPass = unescapeJson(doubleEscaped);
    expect(firstPass).toEqual({
      ok: true,
      value: '{\\"title\\": \\"Test\\"}',
    });
    if (!firstPass.ok) return;
    const secondPass = unescapeJson(firstPass.value);
    expect(secondPass).toEqual({
      ok: true,
      value: '{"title": "Test"}',
    });
  });

  it("unescapes all standard escape sequences and hex/code points", () => {
    const input = '\\" \\\\ \\/ \\b \\f \\n \\r \\t \\v \\0 \\u0041 \\u{1F600} \\x42 \\a';
    expect(unescapeJson(input)).toEqual({
      ok: true,
      value: '" \\ / \b \f \n \r \t \v \0 A 😀 B a',
    });
  });

  it("handles plain strings and unescaped JSON documents gracefully without errors", () => {
    expect(unescapeJson("42")).toEqual({ ok: true, value: "42" });
    expect(unescapeJson('{"value":true}')).toEqual({ ok: true, value: '{"value":true}' });
    expect(unescapeJson("Hello world")).toEqual({ ok: true, value: "Hello world" });
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

  it("dispatches both modes and supports options", () => {
    expect(runJsonEscape("encode", "hello")).toEqual({ ok: true, value: '"hello"' });
    expect(runJsonEscape("encode", "hello", { wrapQuotes: false })).toEqual({
      ok: true,
      value: "hello",
    });
    expect(runJsonEscape("decode", '"hello"')).toEqual({ ok: true, value: "hello" });
    expect(runJsonEscape("decode", '{\\"foo\\":\\"bar\\"}')).toEqual({
      ok: true,
      value: '{"foo":"bar"}',
    });
    expect(runJsonEscape("other" as never, "hello")).toMatchObject({
      ok: false,
      error: { code: "INVALID_MODE" },
    });
  });
});
