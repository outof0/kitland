import { describe, expect, it } from "vitest";
import { inspectJson, JSON_TOOLBOX_MAX_INPUT_CHARS } from "./json-toolbox";

describe("inspectJson", () => {
  it("formats Unicode JSON and returns structural statistics", () => {
    expect(inspectJson('{"title":"café 🍵","enabled":true,"items":[null,2]}')).toEqual({
      ok: true,
      value: {
        formatted:
          '{\n  "title": "café 🍵",\n  "enabled": true,\n  "items": [\n    null,\n    2\n  ]\n}',
        rootType: "object",
        totalValues: 6,
        objectCount: 1,
        arrayCount: 1,
        stringCount: 1,
        numberCount: 1,
        booleanCount: 1,
        nullCount: 1,
        maxDepth: 2,
      },
    });
  });

  it("supports primitive JSON documents", () => {
    expect(inspectJson("false")).toMatchObject({
      ok: true,
      value: { rootType: "boolean", totalValues: 1, booleanCount: 1, maxDepth: 0 },
    });
  });

  it("returns meaningful malformed, empty and size errors", () => {
    expect(inspectJson("{")).toMatchObject({ ok: false, error: { code: "INVALID_JSON" } });
    expect(inspectJson(" \n")).toMatchObject({ ok: false, error: { code: "EMPTY_INPUT" } });
    expect(inspectJson("0".repeat(JSON_TOOLBOX_MAX_INPUT_CHARS + 1))).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
  });
});
