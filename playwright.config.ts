/** Configures the deterministic Expo web export, fixture BFF, and browser release checks. */
import { defineConfig, devices } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const exportDirectory = join(tmpdir(), "concourse-playwright-web");
const testOutputDirectory = process.env.CI
  ? "test-results"
  : join(tmpdir(), "concourse-playwright-results");

export default defineConfig({
  testDir: "./apps/mobile/e2e/web",
  outputDir: testOutputDirectory,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]] : "line",
  use: {
    baseURL: "http://127.0.0.1:8081",
    colorScheme: "light",
    contextOptions: {
      reducedMotion: "reduce",
    },
    locale: "en-US",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    timezoneId: "Europe/Berlin",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "node scripts/mock-public-bff.mjs",
      url: "http://127.0.0.1:4400/health",
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm --filter @concourse/shared build && pnpm --filter @concourse/institutions build && INSTITUTION_ID=example EXPO_PUBLIC_BFF_BASE_URL=http://127.0.0.1:4400 pnpm --filter @concourse/mobile exec expo export --platform web --output-dir ${exportDirectory} --clear && node scripts/serve-expo-export.mjs ${exportDirectory}`,
      url: "http://127.0.0.1:8081/(tabs)/events",
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
