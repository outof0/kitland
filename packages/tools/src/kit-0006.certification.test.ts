import { describe, expect, it } from "vitest";
import { getToolBySlug, listAvailableTools } from "./registry";

/** KIT-0006 batch A: registry honesty for the six Web-certified transforms. */
const KIT_0006_SLUGS = [
  "base64",
  "beautify-minify",
  "json-to-yaml",
  "yaml-to-json",
  "html-entities",
  "hex-text",
] as const;

describe("KIT-0006 registry certification", () => {
  it("marks each batch tool available with web release-ready and honest host contracts", () => {
    for (const slug of KIT_0006_SLUGS) {
      const tool = getToolBySlug(slug);
      expect(tool).toBeDefined();
      if (!tool) continue;
      expect(tool.status).toBe("available");
      expect(tool.pattern).toBe("transform");
      expect(tool.releaseStage).toBe("release-ready");
      expect(tool.platforms.web.status).toBe("available");
      expect(tool.platforms.web.capabilities).toContain("transform-text");
      expect(tool.platforms.web.capabilities).toContain("clipboard-write");
      expect(tool.designFrame).toBeTruthy();
      // Only Base64 may declare share-link in this batch.
      expect(tool.platforms.web.capabilities.includes("share-link")).toBe(slug === "base64");
      // KIT-0017/0018 promoted pure transforms to multi-host with adapters.
      expect(tool.releasePlatforms).toEqual(
        expect.arrayContaining(["web", "browser-extension", "vscode-extension"]),
      );
      expect(tool.platforms["browser-extension"].status).toBe("available");
      expect(tool.platforms["vscode-extension"].status).toBe("available");
    }
  });

  it("includes every KIT-0006 slug in the available registry set", () => {
    const available = new Set(listAvailableTools().map((tool) => tool.slug));
    for (const slug of KIT_0006_SLUGS) {
      expect(available.has(slug)).toBe(true);
    }
  });
});
