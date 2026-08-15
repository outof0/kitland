import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const coreEntry = fileURLToPath(new URL("../core/src/index.ts", import.meta.url));
const catalogEntry = fileURLToPath(new URL("../tool-catalog/src/index.ts", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@kitland/core": coreEntry,
      "@kitland/tools": catalogEntry,
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    testTimeout: 10000,
  },
});
