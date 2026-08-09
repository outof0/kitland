import { getToolBySlug, listToolsByPlatform } from "@kitland/tool-catalog";
import { describe, expect, it } from "vitest";
import { getToolRegistration, TOOL_REGISTRATIONS } from "../src/registry";

describe("generic extension renderer registry", () => {
  it("registers unique catalog-backed slugs", () => {
    const slugs = TOOL_REGISTRATIONS.map(({ tool }) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const registration of TOOL_REGISTRATIONS) {
      expect(registration.tool).toBe(getToolBySlug(registration.tool.slug));
    }
    expect(slugs).toEqual(listToolsByPlatform("browser-extension").map((tool) => tool.slug));
  });

  it("keeps Base64 as a lazy reference adapter", async () => {
    const registration = getToolRegistration("base64");
    expect(registration?.tool.shortName).toBe("Base64");
    expect(typeof registration?.load).toBe("function");
    const renderer = await registration?.load();
    expect(typeof renderer?.mountTool).toBe("function");
  });

  it("does not infer a renderer for an unknown catalog slug", () => {
    expect(getToolRegistration("not-registered")).toBeUndefined();
  });
});
