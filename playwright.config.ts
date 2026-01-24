import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Take video on failure */
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: 'admin-*.spec.ts',
    },

    { name: 'admin.setup', testMatch: /.*admin\.auth\.setup\.ts/ },

    {
      name: 'admin-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['admin.setup'],
      testMatch: 'admin-*.spec.ts',
    },

    {
      name: 'no-auth',
      use: {
        ...devices['Desktop Chrome'],
        // No storageState here, tests will handle their own auth
      },
      testMatch: [
        'tests/check-in-qr.spec.ts',
        'tests/golf-stats.spec.ts',
        'tests/family-management.spec.ts',
        'tests/coach-workflow.spec.ts',
        'tests/stripe-payments.spec.ts',
        'tests/membership-tiers.spec.ts',
        'tests/admin-user-creation.spec.ts',
        'tests/transaction-history.spec.ts',
        'tests/membership-lifecycle.spec.ts',
        'tests/public-flows.spec.ts',
        'tests/membership-webhooks.spec.ts',
        'tests/coach-extended.spec.ts',
        'tests/admin-system.spec.ts',
        'tests/edge-cases.spec.ts',
        'tests/reminders.spec.ts',
        'tests/admin-events.spec.ts',
        'tests/qa-verification.spec.ts',
        'tests/family-schedule-sync.spec.ts',
        'tests/stripe-edge-cases.spec.ts',
        'tests/home-screen-integrity.spec.ts',
        'tests/mobile-layout-audit.spec.ts',
        'tests/debug-overflow.spec.ts'
      ],
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
