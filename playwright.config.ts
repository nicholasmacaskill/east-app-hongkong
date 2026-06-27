import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

const isProd = process.env.PLAYWRIGHT_ENV === 'production';
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || (isProd ? 'https://app.eastsportsgroup.com' : 'https://test-branch-east.vercel.app');

// Dynamically determine the correct .env file based on the baseURL being tested
let envFile = '.env.test'; // Default for test branch
if (isProd || baseURL.includes('app.eastsportsgroup.com')) {
  envFile = '.env.production.latest';
} else if (baseURL.includes('localhost') || baseURL.includes('127.0.0.1')) {
  envFile = '.env.local'; // Local dev server uses .env.local
}

dotenv.config({ path: path.resolve(__dirname, envFile), override: true });


/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 120000,
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
  testDir: './tests',
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1, // Force 1 worker to prevent CPU starvation
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: baseURL,

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
        'tests/faq-role-access.spec.ts',
        'tests/check-in-qr.spec.ts',
        'tests/golf-stats.spec.ts',
        'tests/family-management.spec.ts',
        'tests/coach-workflow.spec.ts',
        'tests/stripe-payments.spec.ts',
        'tests/membership-tiers.spec.ts',
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
        'tests/debug-overflow.spec.ts',
        'tests/verification-schedule-wipe.spec.ts',
        'tests/leaderboard-cms.spec.ts',
        'tests/parent-photo-editability.spec.ts',
        'tests/ticket-19-qr-wallet.spec.ts',
        'tests/drill-hub-e2e.spec.ts',
        'tests/training-plans.spec.ts',
        'tests/session-capacity.spec.ts',
        'tests/share-training-plan-logic.spec.ts',
        'tests/share-training-plan-e2e.spec.ts',
        'tests/appheader-buttons.spec.ts',
        'tests/player-profile-search.spec.ts'
      ],
    },

    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'iphone-se',
      use: {
        ...devices['iPhone SE'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
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

  // No webServer — tests always run against https://test-branch-east.vercel.app
});
