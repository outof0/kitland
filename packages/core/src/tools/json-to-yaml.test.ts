import { describe, expect, it } from "vitest";
import { jsonToYaml, JSON_TO_YAML_MAX_INPUT_CHARS } from "./json-to-yaml";

describe("jsonToYaml", () => {
  it("converts nested Unicode JSON with unambiguous scalar quoting", () => {
    expect(jsonToYaml('{"title":"café 🍵","truth":"true","items":[1,{"name":"A"}]}')).toEqual({
      ok: true,
      value: '"title": "café 🍵"\n"truth": "true"\n"items":\n  - 1\n  -\n    "name": "A"\n',
    });
  });

  it("supports four-space indentation", () => {
    expect(jsonToYaml('{"item":{"name":"Widget"}}', 4)).toEqual({
      ok: true,
      value: '"item":\n    "name": "Widget"\n',
    });
  });

  it("rejects malformed, empty, and oversized JSON", () => {
    expect(jsonToYaml("{")).toMatchObject({ ok: false, error: { code: "INVALID_JSON" } });
    expect(jsonToYaml(" \n")).toMatchObject({ ok: false, error: { code: "EMPTY_INPUT" } });
    expect(jsonToYaml("0".repeat(JSON_TO_YAML_MAX_INPUT_CHARS + 1))).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
  });
});
