import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4321";
const isCI = Boolean(process.env.CI);

/**
 * Smoke the built Astro output through `astro preview`, never the development
 * server. This catches regressions in static delivery, hydration, workers,
 * fragments, and responsive navigation together.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: isCI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "pnpm exec astro preview --host 127.0.0.1 --port 4321",
    // Astro detects coding-agent environments and otherwise backgrounds its
    // preview process. Playwright needs to own the foreground process so it
    // can reliably wait for readiness and shut it down after the suite.
    env: { ...process.env, ASTRO_PREVIEW_BACKGROUND: "1" },
    url: `${baseURL}/explore/base64`,
    reuseExistingServer: !isCI,
    timeout: 30_000,
  },
});
