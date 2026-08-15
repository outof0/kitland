import { describe, expect, it } from "vitest";
import { jsonToJsConst } from "./json-to-js-const";

describe("jsonToJsConst", () => {
  it("emits a const declaration", () => {
    expect(jsonToJsConst('{"a":1}', "sample")).toEqual({
      ok: true,
      value: 'const sample = {\n  "a": 1\n};\n',
    });
  });
  it("honors a 4-space indent", () => {
    expect(jsonToJsConst('{"a":{"b":2}}', "value", 4)).toEqual({
      ok: true,
      value: 'const value = {\n    "a": {\n        "b": 2\n    }\n};\n',
    });
  });
  it("rejects an invalid indent", () => {
    const result = jsonToJsConst("{}", "value", 3 as 2 | 4);
    expect(result).toMatchObject({ ok: false, error: { code: "INVALID_INDENT" } });
  });
  it("rejects invalid json", () => {
    expect(jsonToJsConst("{").ok).toBe(false);
  });
});
