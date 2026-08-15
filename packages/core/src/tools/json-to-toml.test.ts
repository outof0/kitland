import { describe, expect, it } from "vitest";
import { jsonToToml, JSON_TO_TOML_MAX_INPUT_CHARS } from "./json-to-toml";

describe("jsonToToml", () => {
  it("converts nested Unicode objects and scalar arrays to TOML tables", () => {
    expect(
      jsonToToml('{"name":"café 🍵","enabled":true,"tags":["local",2],"meta":{"build":3}}'),
    ).toEqual({
      ok: true,
      value:
        '"name" = "café 🍵"\n"enabled" = true\n"tags" = ["local", 2]\n\n["meta"]\n"build" = 3\n',
    });
  });

  it("rejects nulls, nested array values and non-object roots explicitly", () => {
    expect(jsonToToml('{"value":null}')).toMatchObject({
      ok: false,
      error: { code: "UNSUPPORTED_VALUE" },
    });
    expect(jsonToToml('{"items":[{"id":1}]}')).toMatchObject({
      ok: false,
      error: { code: "UNSUPPORTED_VALUE" },
    });
    expect(jsonToToml("[]")).toMatchObject({ ok: false, error: { code: "INVALID_ROOT" } });
  });

  it("rejects malformed, empty and oversized JSON", () => {
    expect(jsonToToml("{")).toMatchObject({ ok: false, error: { code: "INVALID_JSON" } });
    expect(jsonToToml(" \n")).toMatchObject({ ok: false, error: { code: "EMPTY_INPUT" } });
    expect(jsonToToml("0".repeat(JSON_TO_TOML_MAX_INPUT_CHARS + 1))).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
  });
});
