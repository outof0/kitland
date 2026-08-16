import { defineConfig } from "vitest/config";
import { workspaceAliases } from "./workspace-aliases";

export default defineConfig({
  resolve: {
    alias: workspaceAliases,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
