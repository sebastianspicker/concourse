import { defineConfig, devices } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const exportDirectory = join(tmpdir(), "campus-app-kit-playwright-web");

export default defineConfig({
  testDir: "./apps/mobile/e2e-web",
  outputDir: join(tmpdir(), "campus-app-kit-playwright-results"),
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]] : "line",
  use: {
    baseURL: "http://127.0.0.1:8081",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  ],
  webServer: [
    {
      command: "node scripts/mock-public-bff.mjs",
      url: "http://127.0.0.1:4400/health",
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `INSTITUTION_ID=example EXPO_PUBLIC_BFF_BASE_URL=http://127.0.0.1:4400 pnpm --filter @campus/mobile exec expo export --platform web --output-dir ${exportDirectory} --clear && node scripts/serve-expo-export.mjs ${exportDirectory}`,
      url: "http://127.0.0.1:8081/(tabs)/events",
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
