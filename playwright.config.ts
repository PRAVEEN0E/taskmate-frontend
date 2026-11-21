import { defineConfig, devices } from '@playwright/test';
const node = `"${process.execPath}"`;
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:3101',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    channel: 'msedge',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Edge'] } },
    {
      name: 'mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: [
    {
      command: `${node} ../node_modules/tsx/dist/cli.mjs tests/fixture-server.mts`,
      url: 'http://127.0.0.1:4101/healthz',
      reuseExistingServer: false,
      timeout: 60000,
    },
    {
      command: `${node} ../node_modules/next/dist/bin/next dev --port 3101 --hostname 127.0.0.1`,
      url: 'http://127.0.0.1:3101/login',
      env: { API_INTERNAL_URL: 'http://127.0.0.1:4101' },
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
