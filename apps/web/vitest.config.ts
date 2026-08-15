import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@kitland/tools": path.resolve(__dirname, "../../packages/tools/src/index.ts"),
      "@kitland/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
      "@kitland/ui/workspace.css": path.resolve(__dirname, "../../packages/ui/workspace.css"),
      "@kitland/ui/tools": path.resolve(__dirname, "../../packages/ui/src/tools"),
      "@kitland/ui/catalog": path.resolve(
        __dirname,
        "../../packages/ui/src/tools/shared-catalog-tools.tsx",
      ),
      "@kitland/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
