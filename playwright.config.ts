import { defineConfig, devices } from '@playwright/test';
import { hosting } from './site.config.mjs';

const origin = 'http://127.0.0.1:4180';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: origin,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  webServer: {
    command: 'npm run serve',
    url: `${origin}${hosting.base}/`,
    reuseExistingServer: !process.env.CI,
  },
});
