import { describe, expect, it } from "vitest";
import {
  BEAUTIFY_MINIFY_MAX_INPUT_CHARS,
  detectCodeLanguage,
  formatCode,
  formatCss,
  formatHtml,
  formatJs,
  formatJson,
  type JsonFormatMode,
} from "./beautify-minify";

describe("formatJson", () => {
  it("beautifies JSON with the selected indentation", () => {
    expect(formatJson('{"name":"café 🍵","items":[true,2]}', "beautify", { indent: 4 })).toEqual({
      ok: true,
      value: '{\n    "name": "café 🍵",\n    "items": [\n        true,\n        2\n    ]\n}',
    });
  });

  it("minifies a valid JSON document without changing its structure", () => {
    expect(formatJson('{\n "a": 1, "b": [ true, null ]\n}', "minify")).toEqual({
      ok: true,
      value: '{"a":1,"b":[true,null]}',
    });
  });

  it("returns actionable errors for empty, malformed, oversized, and unknown modes", () => {
    expect(formatJson("   ", "beautify")).toMatchObject({
      ok: false,
      error: { code: "EMPTY_INPUT" },
    });
    expect(formatJson("{", "beautify")).toMatchObject({
      ok: false,
      error: { code: "INVALID_JSON" },
    });
    expect(formatJson("0".repeat(BEAUTIFY_MINIFY_MAX_INPUT_CHARS + 1), "minify")).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
    expect(formatJson("{}", "other" as JsonFormatMode)).toMatchObject({
      ok: false,
      error: { code: "INVALID_MODE" },
    });
  });
});

describe("detectCodeLanguage", () => {
  it("detects HTML, XML, CSS, JavaScript, SQL, and JSON correctly", () => {
    expect(detectCodeLanguage("<div><span>Hello</span></div>")).toBe("html");
    expect(detectCodeLanguage('<?xml version="1.0"?><root></root>')).toBe("xml");
    expect(detectCodeLanguage("body { background: #fff; color: red; }")).toBe("css");
    expect(detectCodeLanguage("const a = 1; function test() { return a; }")).toBe("javascript");
    expect(detectCodeLanguage("SELECT id, name FROM users WHERE active = 1")).toBe("sql");
    expect(detectCodeLanguage('{"key": "value"}')).toBe("json");
  });
});

describe("formatCode multi-language support", () => {
  it("formats and minifies CSS", () => {
    const css = "body{color:red;background:blue;}";
    const beautified = formatCss(css, "beautify", { indent: 2 });
    expect(beautified).toEqual(expect.objectContaining({ ok: true }));
    expect((beautified as { value: string }).value).toContain("body {");
    expect((beautified as { value: string }).value).toContain("  color: red;");

    const minified = formatCss("body {\n  color: red;\n  background: blue;\n}", "minify");
    expect(minified).toEqual(
      expect.objectContaining({ ok: true, value: "body{color:red;background:blue}" }),
    );
  });

  it("formats and minifies HTML", () => {
    const html = "<div><p>Hello</p></div>";
    const beautified = formatHtml(html, "beautify", { indent: 2 });
    expect(beautified.ok).toBe(true);

    const minified = formatHtml("<div>\n  <p>\n    Hello\n  </p>\n</div>", "minify");
    expect(minified).toEqual(
      expect.objectContaining({ ok: true, value: "<div><p> Hello </p></div>" }),
    );
  });

  it("formats and minifies JavaScript", () => {
    const js = "function hello(){console.log('hi');}";
    const beautified = formatJs(js, "beautify", { indent: 2 });
    expect(beautified.ok).toBe(true);

    const minified = formatJs("function hello() {\n  console.log('hi');\n}", "minify");
    expect(minified.ok).toBe(true);
  });

  it("handles formatCode with auto-detection", () => {
    const res = formatCode("SELECT * FROM users", "auto", "beautify");
    expect(res).toEqual(expect.objectContaining({ ok: true }));
    expect((res as { value: { detectedLanguage: string } }).value.detectedLanguage).toBe("sql");
  });
});
