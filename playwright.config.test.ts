import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// FORCE LOAD .env.test for separation from Production
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  timeout: 120000,
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, 
  reporter: 'list',
  use: {
    // Specifically target the test branch deployment
    baseURL: 'https://test-branch-east.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'off',
  },

  projects: [
    {
      name: 'test-verification',
      use: { 
        ...devices['Desktop Chrome'],
        // No storageState, tests will handle their own auth
      },
      testMatch: 'tests/qa-verification.test.spec.ts',
    },
  ],

  // NO webServer - testing the live deployed test site
});
