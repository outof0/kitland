import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const coreEntry = fileURLToPath(new URL("../core/src/index.ts", import.meta.url));
const registryEntry = fileURLToPath(new URL("../tool-registry/src/index.ts", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@kitland/core": coreEntry,
      "@kitland/tools": registryEntry,
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    testTimeout: 10000,
  },
});
