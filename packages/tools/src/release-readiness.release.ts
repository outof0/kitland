import { describe, expect, it } from "vitest";
import { getCatalogReleaseReadiness } from "./catalog";

describe("production complete-suite release gate", () => {
  it("allows release only when the entire 64-tool catalog is ready", () => {
    const readiness = getCatalogReleaseReadiness();
    // The full structured issue list remains available to callers. Keep CI
    // output actionable at 64-tool scale instead of printing hundreds of
    // repeated per-platform messages.
    const counts = new Map<string, number>();
    for (const issue of readiness.issues) {
      counts.set(issue.code, (counts.get(issue.code) ?? 0) + 1);
    }
    const failures = Array.from(counts, ([code, count]) => `- ${code}: ${count}`).join("\n");

    if (!readiness.ready) {
      throw new Error(
        `Production release is blocked by the catalog contract:\n${failures}\n` +
          "Inspect getCatalogReleaseReadiness().issues for tool-specific remediation.",
      );
    }
    expect(readiness.ready).toBe(true);
  });
});
