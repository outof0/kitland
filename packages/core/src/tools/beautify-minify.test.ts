import { describe, expect, it } from "vitest";
import {
  BEAUTIFY_MINIFY_MAX_INPUT_CHARS,
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
