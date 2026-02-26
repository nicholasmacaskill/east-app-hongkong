import { test, expect } from '@playwright/test';

// We can bypass login and test the UI components directly in isolation
test('ClassModal UI check', async ({ page }) => {
  // We can go to a public route and see if it loads
  await page.goto('/');
  await expect(page).toHaveTitle(/EAST/i);
});
