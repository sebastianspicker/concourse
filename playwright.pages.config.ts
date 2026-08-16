/** Runs request-free browser and accessibility checks against the exact Pages artifact. */
import { defineConfig, devices } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";

export default defineConfig({
  testDir: "./apps/mobile/e2e/pages",
  outputDir: join(tmpdir(), "concourse-pages-playwright-results"),
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:8082/concourse/",
    colorScheme: "light",
    contextOptions: { reducedMotion: "reduce" },
    locale: "en-US",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    timezoneId: "Europe/Berlin",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "PORT=8082 node scripts/serve-pages-output.mjs dist-pages",
    url: "http://127.0.0.1:8082/concourse/",
    timeout: 30_000,
    reuseExistingServer: !process.env.CI,
  },
});
