import { describe, expect, it } from "vitest";
import { getCatalogSurfaceRolloutReadiness } from "./catalog";
import { parseSurfaceRolloutPlatform } from "./surface-rollout";

const platform = parseSurfaceRolloutPlatform(process.env.KITLAND_RELEASE_PLATFORM);

describe(`${platform} rollout release gate`, () => {
  it("allows deployment only after at least one canonical tool is certified for this surface", () => {
    const readiness = getCatalogSurfaceRolloutReadiness(platform);

    if (!readiness.ready) {
      const failures = readiness.issues
        .map((issue) => `- ${issue.code}: ${issue.message}`)
        .join("\n");
      throw new Error(
        `${platform} rollout is blocked by the catalog contract:\n${failures}\n` +
          "Certify the tool for this surface only after its focused host checks pass.",
      );
    }

    expect(readiness.platform).toBe(platform);
    expect(readiness.targetToolCount).toBeGreaterThan(0);
    expect(readiness.targetToolSlugs).toHaveLength(readiness.targetToolCount);
  });
});
