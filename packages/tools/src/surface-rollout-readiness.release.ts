import { describe, expect, it } from "vitest";
import { getRegistrySurfaceRolloutReadiness } from "./registry";
import { parseSurfaceRolloutPlatform } from "./surface-rollout";

const releaseEnvironment = globalThis as typeof globalThis & {
  readonly process?: {
    readonly env: Readonly<Record<string, string | undefined>>;
  };
};

const platform = parseSurfaceRolloutPlatform(
  releaseEnvironment.process?.env.KITLAND_RELEASE_PLATFORM,
);

describe(`${platform} rollout release gate`, () => {
  it("allows deployment only after at least one canonical tool is certified for this surface", () => {
    const readiness = getRegistrySurfaceRolloutReadiness(platform);

    if (!readiness.ready) {
      const failures = readiness.issues
        .map((issue) => `- ${issue.code}: ${issue.message}`)
        .join("\n");
      throw new Error(
        `${platform} rollout is blocked by the registry contract:\n${failures}\n` +
          "Certify the tool for this surface only after its focused host checks pass.",
      );
    }

    expect(readiness.platform).toBe(platform);
    expect(readiness.targetToolCount).toBeGreaterThan(0);
    expect(readiness.targetToolSlugs).toHaveLength(readiness.targetToolCount);
  });
});
