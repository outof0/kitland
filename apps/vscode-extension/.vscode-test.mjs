import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "dist/test/**/*.test.cjs",
  version: "1.100.0",
  launchArgs: ["--disable-extensions"],
});
