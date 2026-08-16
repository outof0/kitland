import { getToolBySlug, listToolsByPlatform } from "@kitland/tools";
import { describe, expect, it } from "vitest";
import { getToolRegistration, TOOL_REGISTRATIONS } from "../src/registry";

describe("generic extension renderer registry", () => {
  it("registers unique registry-backed slugs", () => {
    const slugs = TOOL_REGISTRATIONS.map(({ tool }) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const registration of TOOL_REGISTRATIONS) {
      expect(registration.tool).toBe(getToolBySlug(registration.tool.slug));
    }
    expect([...slugs].sort()).toEqual(
      listToolsByPlatform("browser-extension")
        .map((tool) => tool.slug)
        .sort(),
    );
  });

  it("keeps host adapters lazy", async () => {
    for (const [slug, shortName] of [
      ["base64", "Base64"],
      ["curl-converter", "cURL Converter"],
      ["json-formatter", "JSON Formatter"],
      ["beautify-minify", "Beautify / Minify"],
      ["rot13-caesar", "ROT13 Caesar"],
    ] as const) {
      const registration = getToolRegistration(slug);
      expect(registration?.tool.shortName).toBe(shortName);
      expect(typeof registration?.load).toBe("function");
      const renderer = await registration?.load();
      expect(typeof renderer?.default).toBe("function");
    }
  });

  it("does not infer a renderer for an unknown registry slug", () => {
    expect(getToolRegistration("not-registered")).toBeUndefined();
  });
});
