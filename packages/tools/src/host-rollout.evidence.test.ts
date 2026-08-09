import { describe, expect, it } from "vitest";
import { listReleaseReadyTools, listTools, listToolsByPlatform } from "./catalog";

/**
 * KIT-0020 path B: full multi-host availability for the canonical 64-tool suite.
 */
describe("multi-host full catalog rollout", () => {
  it("makes every tool available on web, browser-extension, and VS Code", () => {
    const all = listTools();
    const be = listToolsByPlatform("browser-extension");
    const vs = listToolsByPlatform("vscode-extension");
    const web = listToolsByPlatform("web");
    const releaseReady = listReleaseReadyTools();

    expect(all).toHaveLength(64);
    expect(all.every((tool) => tool.status === "available")).toBe(true);
    expect(web).toHaveLength(64);
    expect(be).toHaveLength(64);
    expect(vs).toHaveLength(64);
    expect(be.map((tool) => tool.slug).sort()).toEqual(vs.map((tool) => tool.slug).sort());
    expect(be.map((tool) => tool.slug).sort()).toEqual(web.map((tool) => tool.slug).sort());
    expect(releaseReady.length).toBeGreaterThanOrEqual(35);

    for (const tool of all) {
      expect(tool.platforms.web.status).toBe("available");
      expect(tool.platforms["browser-extension"].status).toBe("available");
      expect(tool.platforms["vscode-extension"].status).toBe("available");
      expect(tool.platforms["browser-extension"].capabilities).not.toContain("share-link");
      expect(tool.platforms["vscode-extension"].capabilities).not.toContain("share-link");
    }
  });
});
