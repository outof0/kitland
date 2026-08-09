import { describe, expect, it } from "vitest";
import { jsonToYaml } from "./json-to-yaml";
import { yamlToJson } from "./yaml-to-json";
import { YAML_CODEC_MAX_INPUT_CHARS } from "./yaml-codec";

describe("yamlToJson", () => {
  it("converts mappings, nested sequences, Unicode and comments", () => {
    expect(
      yamlToJson(
        "# title\nname: \"café 🍵\"\nactive: true\nitems:\n  - 1\n  -\n    label: 'second' # item\n",
      ),
    ).toEqual({
      ok: true,
      value:
        '{\n  "name": "café 🍵",\n  "active": true,\n  "items": [\n    1,\n    {\n      "label": "second"\n    }\n  ]\n}',
    });
  });

  it("accepts a single document marker and trailing whitespace", () => {
    expect(yamlToJson('---\nname: "Widget"\n...\n\n')).toEqual({
      ok: true,
      value: '{\n  "name": "Widget"\n}',
    });
  });

  it("round-trips the YAML emitted by jsonToYaml", () => {
    const input = '{"name":"Widget","flags":[true,false],"meta":{"build":2}}';
    const yaml = jsonToYaml(input);
    if (!yaml.ok) throw new Error(yaml.error.message);
    expect(yamlToJson(yaml.value)).toEqual({
      ok: true,
      value: JSON.stringify(JSON.parse(input), null, 2),
    });
  });

  it("rejects malformed indentation, duplicate keys, and unsafe YAML features", () => {
    expect(yamlToJson("item:\n  child: 1\n child: 2")).toMatchObject({
      ok: false,
      error: { code: "INVALID_YAML" },
    });
    expect(yamlToJson("name: one\nname: two")).toMatchObject({
      ok: false,
      error: { code: "INVALID_YAML" },
    });
    expect(yamlToJson("base: &base\nname: *base")).toMatchObject({
      ok: false,
      error: { code: "INVALID_YAML" },
    });
    expect(yamlToJson('name: "unterminated')).toMatchObject({
      ok: false,
      error: { code: "INVALID_YAML" },
    });
    expect(yamlToJson("a".repeat(YAML_CODEC_MAX_INPUT_CHARS + 1))).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
  });
});
