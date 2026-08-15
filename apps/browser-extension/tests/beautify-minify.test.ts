import { formatJson, BEAUTIFY_MINIFY_MAX_INPUT_CHARS } from "@kitland/core";
import { BeautifyMinifyTool } from "@kitland/ui/tools/BeautifyMinifyTool";
import { describe, expect, it } from "vitest";
import { getToolRegistration } from "../src/registry";

describe("Beautify / Minify extension contract", () => {
  it("mounts the shared @kitland/ui tool with no host-local markup", async () => {
    const registration = getToolRegistration("beautify-minify");
    const module = await registration?.load();
    expect(module?.default).toBe(BeautifyMinifyTool);
  });

  it("keeps the local formatting bounded through the shared core", () => {
    const valid = formatJson('{"name":"Kitland","local":true}', "beautify");
    expect(valid.ok).toBe(true);

    const minified = formatJson('{\n  "name": "Kitland"\n}', "minify");
    expect(minified).toEqual({ ok: true, value: '{"name":"Kitland"}' });

    const invalid = formatJson('{"unterminated":', "beautify");
    expect(invalid.ok).toBe(false);

    const oversized = formatJson(
      "[".concat("1,".repeat(BEAUTIFY_MINIFY_MAX_INPUT_CHARS), "1]"),
      "beautify",
    );
    expect(oversized.ok).toBe(false);
  });
});
