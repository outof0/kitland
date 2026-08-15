import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/surface-rollout-readiness.release.ts"],
  },
});
