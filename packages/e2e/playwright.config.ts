import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.e2e.ts', '**/*.e2e.js'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    [
      'html',
      {
        outputFolder: 'playwright-report',
      },
    ],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 800 },
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          headless: true
        },
        actionTimeout: 120000,
        navigationTimeout: 120000,
        testTimeout: 120000,
      },
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['iPhone 6'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      },
    },
  ],
});
