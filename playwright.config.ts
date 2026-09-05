import { defineConfig, devices } from '@playwright/test';

const requestedPort = Number.parseInt(process.env.PLAYWRIGHT_PORT ?? '3000', 10);
const playwrightPort = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 3000;
const playwrightBaseUrl = `http://localhost:${playwrightPort}`;
const adsenseEnabledForTest = process.env.PLAYWRIGHT_ADSENSE_ENABLED === 'true';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: playwrightBaseUrl,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${playwrightPort}`,
    url: playwrightBaseUrl,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      NEXT_PUBLIC_ADSENSE_ENABLED: adsenseEnabledForTest ? 'true' : 'false',
      NEXT_PUBLIC_ADSENSE_CLIENT_ID: 'ca-pub-5483347501870595',
      NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID: adsenseEnabledForTest ? '1111111111' : '',
      NEXT_PUBLIC_ADSENSE_TOOL_SLOT_ID: adsenseEnabledForTest ? '2222222222' : '',
      NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT_ID: adsenseEnabledForTest ? '3333333333' : '',
      NEXT_PUBLIC_E2E_TEST: 'true',
    },
  },
});
