import { describe, expect, it } from "vitest";
import {
  inspectJson,
  JSON_FORMATTER_MAX_DEPTH,
  JSON_FORMATTER_MAX_INPUT_CHARS,
  JSON_FORMATTER_MAX_NODES,
  JSON_FORMATTER_MAX_OUTPUT_CHARS,
} from "./json-formatter";

function expectError(
  source: string,
  code: string,
  indent: 2 | 4 | "tab" = 2,
  mode: "beautify" | "minify" = "beautify",
) {
  expect(inspectJson(source, indent, mode)).toMatchObject({ ok: false, error: { code } });
}

describe("inspectJson", () => {
  it("formats Unicode JSON and counts every value type", () => {
    expect(inspectJson('{"title":"café 🍵","enabled":true,"items":[null,2],"nested":{}}')).toEqual({
      ok: true,
      value: {
        formatted:
          '{\n  "title": "café 🍵",\n  "enabled": true,\n  "items": [\n    null,\n    2\n  ],\n  "nested": {}\n}',
        rootType: "object",
        totalValues: 7,
        objectCount: 2,
        arrayCount: 1,
        stringCount: 1,
        numberCount: 1,
        booleanCount: 1,
        nullCount: 1,
        maxDepth: 2,
      },
    });
  });

  it.each([
    ["{}", "object"],
    ["[]", "array"],
    ['"text"', "string"],
    ["1", "number"],
    ["false", "boolean"],
    ["null", "null"],
  ] as const)("supports the primitive or container root %s", (source, rootType) => {
    expect(inspectJson(source)).toMatchObject({
      ok: true,
      value: { rootType, totalValues: 1, maxDepth: 0 },
    });
  });

  it("matches native pretty output for both indent options and is deterministic", () => {
    const source =
      '{"z":[1,{"escaped":"line\\n\\t\\\"","astral":"😀","lone":"\\ud800"}],"a":false}';
    for (const indent of [2, 4] as const) {
      const expected = JSON.stringify(JSON.parse(source), null, indent);
      expect(inspectJson(source, indent)).toMatchObject({
        ok: true,
        value: { formatted: expected },
      });
      expect(inspectJson(source, indent)).toEqual(inspectJson(source, indent));
    }
    const tabExpected = JSON.stringify(JSON.parse(source), null, "\t");
    expect(inspectJson(source, "tab")).toMatchObject({
      ok: true,
      value: { formatted: tabExpected },
    });
  });

  it("minifies with native parsed-value semantics while preserving inspection statistics", () => {
    const source =
      '{"same":1,"same":2,"number":9007199254740993,"items":[true,null],"nested":{"ok":"🍵"}}';
    const result = inspectJson(source, 4, "minify");
    expect(result).toMatchObject({
      ok: true,
      value: {
        formatted: JSON.stringify(JSON.parse(source)),
        rootType: "object",
        totalValues: 8,
        objectCount: 2,
        arrayCount: 1,
        stringCount: 1,
        numberCount: 2,
        booleanCount: 1,
        nullCount: 1,
        maxDepth: 2,
      },
    });
  });

  it("keeps native duplicate-key, binary64, and integer-like key semantics visible", () => {
    const result = inspectJson(
      '{"same":1,"same":2,"number":9007199254740993,"10":"ten","2":"two","a":1}',
    );
    expect(result).toMatchObject({
      ok: true,
      value: {
        formatted:
          '{\n  "2": "two",\n  "10": "ten",\n  "same": 2,\n  "number": 9007199254740992,\n  "a": 1\n}',
      },
    });
  });

  it("uses stable errors and the specified validation precedence", () => {
    expect(inspectJson("{")).toEqual({
      ok: false,
      error: { code: "INVALID_JSON", message: "JSON is invalid." },
    });
    expectError(" \n", "EMPTY_INPUT");
    expect(inspectJson("{}", 3 as 2)).toEqual({
      ok: false,
      error: { code: "INVALID_INDENT", message: "JSON indentation must be 2 or 4 spaces, or tab." },
    });
    expect(inspectJson("{}", 2, "compact" as never)).toEqual({
      ok: false,
      error: { code: "INVALID_MODE", message: "JSON output mode must be beautify or minify." },
    });
    expectError("[".repeat(JSON_FORMATTER_MAX_DEPTH + 2), "INPUT_TOO_DEEP");
    expectError("0".repeat(JSON_FORMATTER_MAX_INPUT_CHARS + 1), "INPUT_TOO_LARGE", 4);
    expect(inspectJson("0".repeat(JSON_FORMATTER_MAX_INPUT_CHARS + 1), 3 as 2)).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
  });

  it("uses UTF-16 code units for the exact input boundary", () => {
    const exact = JSON.stringify("😀".repeat((JSON_FORMATTER_MAX_INPUT_CHARS - 2) / 2));
    expect(exact.length).toBe(JSON_FORMATTER_MAX_INPUT_CHARS);
    expect(inspectJson(exact).ok).toBe(true);
    expectError(`${exact} `, "INPUT_TOO_LARGE");
  });

  it("accepts exactly 100,000 values and rejects 100,001", () => {
    const exact = `[${"0,".repeat(JSON_FORMATTER_MAX_NODES - 2)}0]`;
    const plusOne = `[${"0,".repeat(JSON_FORMATTER_MAX_NODES - 1)}0]`;
    expect(inspectJson(exact)).toMatchObject({
      ok: true,
      value: { totalValues: JSON_FORMATTER_MAX_NODES },
    });
    expectError(plusOne, "INPUT_TOO_COMPLEX");
  });

  it("accepts max depth 128 and rejects depth 129", () => {
    const exact = `${"[".repeat(JSON_FORMATTER_MAX_DEPTH)}0${"]".repeat(JSON_FORMATTER_MAX_DEPTH)}`;
    const plusOne = `[${exact}]`;
    expect(inspectJson(exact)).toMatchObject({
      ok: true,
      value: { maxDepth: JSON_FORMATTER_MAX_DEPTH },
    });
    expectError(plusOne, "INPUT_TOO_DEEP");
  });

  it("ignores braces in quoted and escaped strings during depth preflight", () => {
    const source = JSON.stringify({ text: `${"[".repeat(200)}\\"${"]".repeat(200)}` });
    expect(inspectJson(source).ok).toBe(true);
  });

  it("enforces the exact formatted-output boundary without a whole-document stringify", () => {
    const exact = `["${"x".repeat(JSON_FORMATTER_MAX_OUTPUT_CHARS - 8)}"]`;
    const plusOne = `["${"x".repeat(JSON_FORMATTER_MAX_OUTPUT_CHARS - 7)}"]`;
    const result = inspectJson(exact);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.formatted.length).toBe(JSON_FORMATTER_MAX_OUTPUT_CHARS);
    expectError(plusOne, "OUTPUT_TOO_LARGE");
  });

  it("enforces the same bounded output limit for minified JSON", () => {
    const exact = `"${"x".repeat(JSON_FORMATTER_MAX_OUTPUT_CHARS - 2)}"`;
    const result = inspectJson(exact, 2, "minify");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.formatted.length).toBe(JSON_FORMATTER_MAX_OUTPUT_CHARS);
  });
});
