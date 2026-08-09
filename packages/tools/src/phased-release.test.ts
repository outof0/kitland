import { describe, expect, it } from "vitest";
import {
  getCatalogPhasedReleaseReadiness,
  getCatalogSurfaceRolloutReadiness,
  listReleaseReadyTools,
  listSurfaceRolloutCandidates,
  listSurfaceRolloutTools,
  listTools,
} from "./catalog";
import { CANONICAL_TOOL_INVENTORY } from "./inventory";
import { evaluateCatalogPhasedReleaseReadiness } from "./phased-release";
import {
  evaluateCatalogSurfaceRolloutReadiness,
  isToolCertifiedForSurface,
  parseSurfaceRolloutPlatform,
} from "./surface-rollout";
import type { ToolDefinition } from "./types";

describe("surface rollout release gate", () => {
  it("certifies the complete suite on every surface independently", () => {
    const webTargets = listSurfaceRolloutTools("web");
    const browserTargets = listSurfaceRolloutTools("browser-extension");
    const vscodeTargets = listSurfaceRolloutTools("vscode-extension");
    const certifiedSlugs = [
      "base64",
      "json-formatter",
      "curl-converter",
      "text-diff",
      "password-generator",
    ];

    expect(webTargets).toHaveLength(64);
    expect(browserTargets).toHaveLength(64);
    expect(vscodeTargets).toHaveLength(64);
    for (const targets of [webTargets, browserTargets, vscodeTargets]) {
      expect(targets.map((tool) => tool.slug)).toEqual(expect.arrayContaining(certifiedSlugs));
      expect(targets.every((tool) => isToolCertifiedForSurface(tool, "web"))).toBe(true);
    }
    expect(getCatalogSurfaceRolloutReadiness("web")).toMatchObject({
      ready: true,
      platform: "web",
      targetToolCount: 64,
      issues: [],
    });
  });

  it("does not require browser or VS Code certification before a web rollout", () => {
    const readyTool = listSurfaceRolloutTools("web")[0];
    if (!readyTool) throw new Error("Expected a web rollout fixture.");

    const webOnlyTool: ToolDefinition = {
      ...readyTool,
      releasePlatforms: ["web"],
      platforms: {
        ...readyTool.platforms,
        "browser-extension": {
          status: "planned",
          capabilities: ["transform-text"],
        },
        "vscode-extension": {
          status: "planned",
          capabilities: ["transform-text"],
        },
      },
    };
    const inventory = [{ id: webOnlyTool.id, slug: webOnlyTool.slug }];

    expect(evaluateCatalogSurfaceRolloutReadiness([webOnlyTool], "web", inventory)).toMatchObject({
      ready: true,
      targetToolSlugs: [webOnlyTool.slug],
      issues: [],
    });
    expect(
      evaluateCatalogSurfaceRolloutReadiness(
        [webOnlyTool],
        "browser-extension",
        inventory,
      ).issues.map((issue) => issue.code),
    ).toContain("NO_SURFACE_ROLLOUT_TOOLS");
  });

  it("reports no remaining migration queue once the suite is certified", () => {
    const candidates = listSurfaceRolloutCandidates("web");

    expect(candidates).toHaveLength(0);
  });

  it("blocks an empty surface rollout instead of treating it as a successful no-op", () => {
    const tools = listTools().map((tool) => ({ ...tool, releasePlatforms: [] as const }));
    const readiness = evaluateCatalogSurfaceRolloutReadiness(
      tools,
      "web",
      CANONICAL_TOOL_INVENTORY,
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.issues.map((issue) => issue.code)).toContain("NO_SURFACE_ROLLOUT_TOOLS");
  });

  it("requires each declared rollout target to remain canonical, certified, and available on that surface", () => {
    const readyTool = listSurfaceRolloutTools("web")[0];
    if (!readyTool) throw new Error("Expected a web rollout fixture.");

    const malformedTarget: ToolDefinition = {
      ...readyTool,
      id: "unreviewed-rollout-tool",
      slug: "unreviewed-rollout-tool",
      releaseStage: "implemented",
      releasePlatforms: ["web"],
      status: "coming-soon",
      platforms: {
        ...readyTool.platforms,
        web: { ...readyTool.platforms.web, status: "planned" },
      },
    };
    const readiness = evaluateCatalogSurfaceRolloutReadiness(
      [malformedTarget],
      "web",
      CANONICAL_TOOL_INVENTORY,
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "SURFACE_ROLLOUT_TOOL_NOT_IN_CANONICAL_INVENTORY",
        "SURFACE_ROLLOUT_TOOL_NOT_RELEASE_READY",
        "SURFACE_ROLLOUT_PLATFORM_UNAVAILABLE",
      ]),
    );
  });

  it("keeps the phased names as a web-only compatibility alias", () => {
    expect(listReleaseReadyTools().map((tool) => tool.slug)).toEqual(
      listSurfaceRolloutTools("web").map((tool) => tool.slug),
    );
    expect(getCatalogPhasedReleaseReadiness()).toEqual(getCatalogSurfaceRolloutReadiness("web"));
    expect(evaluateCatalogPhasedReleaseReadiness(listTools())).toEqual(
      getCatalogSurfaceRolloutReadiness("web"),
    );
  });

  it("parses only declared rollout surfaces", () => {
    expect(parseSurfaceRolloutPlatform(undefined)).toBe("web");
    expect(parseSurfaceRolloutPlatform("browser-extension")).toBe("browser-extension");
    expect(() => parseSurfaceRolloutPlatform("desktop-app")).toThrow(
      /Invalid KITLAND_RELEASE_PLATFORM/,
    );
  });
});
