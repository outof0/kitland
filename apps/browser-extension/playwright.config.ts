import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:43817";
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL,
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm preview",
    url: `${baseURL}/popup.html`,
    reuseExistingServer: !isCI,
    timeout: 30_000,
  },
});
