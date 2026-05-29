import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.production.local') });

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: 'https://app.eastsportsgroup.com',
    trace: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'prod',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
