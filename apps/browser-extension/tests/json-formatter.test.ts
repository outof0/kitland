import { inspectJson, JSON_FORMATTER_MAX_INPUT_CHARS } from "@kitland/core";
import { JsonFormatterTool } from "@kitland/ui/tools/JsonFormatterTool";
import { describe, expect, it } from "vitest";
import { getToolRegistration } from "../src/registry";

describe("JSON Formatter extension contract", () => {
  it("mounts the shared @kitland/ui tool with no host-local markup", async () => {
    const registration = getToolRegistration("json-formatter");
    const module = await registration?.load();
    expect(module?.default).toBe(JsonFormatterTool);
  });

  it("keeps the local inspection bounded through the shared core", () => {
    const valid = inspectJson('{"name":"Kitland","local":true}');
    expect(valid.ok).toBe(true);

    const invalid = inspectJson('{"unterminated":');
    expect(invalid.ok).toBe(false);

    const oversized = inspectJson("[".concat("1,".repeat(JSON_FORMATTER_MAX_INPUT_CHARS), "1]"));
    expect(oversized.ok).toBe(false);
  });
});
