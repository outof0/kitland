import { describe, expect, it } from "vitest";
import { getCatalogSurfaceRolloutReadiness } from "./catalog";

describe("legacy phased web rollout gate", () => {
  it("delegates to the web surface certification contract", () => {
    const readiness = getCatalogSurfaceRolloutReadiness("web");

    if (!readiness.ready) {
      const failures = readiness.issues
        .map((issue) => `- ${issue.code}: ${issue.message}`)
        .join("\n");
      throw new Error(
        `Web rollout is blocked by the catalog contract:\n${failures}\n` +
          "Certify a tool only after its focused web checks pass.",
      );
    }

    expect(readiness.targetToolCount).toBeGreaterThan(0);
    expect(readiness.targetToolSlugs).toHaveLength(readiness.targetToolCount);
  });
});
