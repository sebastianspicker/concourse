import { defineConfig } from '@playwright/test';

const production = process.env.CONCOURSE_WEB_BUILD === 'production';
const normalUrl = process.env.CONCOURSE_NORMAL_URL ?? (production ? 'http://localhost:8084' : 'http://localhost:8083');

export default defineConfig({
  testDir: './apps/client/e2e-web',
  outputDir: process.env.CONCOURSE_WEB_RESULTS ?? '/tmp/concourse-playwright-results',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { browserName: 'chromium', locale: 'en-US', timezoneId: 'Europe/Berlin', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: [
    { command: 'node scripts/serve-pages-output.mjs', url: 'http://127.0.0.1:8082/concourse-campus-kit/', reuseExistingServer: !process.env.CI },
    {
      command: production ? 'node scripts/serve-client-output.mjs build/web-profile' : 'corepack pnpm@9.15.0 --filter @concourse/client exec expo start --web --port 8083',
      url: normalUrl, timeout: 180_000, reuseExistingServer: !process.env.CI,
      env: { CI: '1', CONCOURSE_STATIC_DEMO: '0', INSTITUTION_ID: 'example', EXPO_PUBLIC_BFF_BASE_URL: production ? 'https://bff.example.edu' : 'http://localhost:4000' },
    },
  ],
});
