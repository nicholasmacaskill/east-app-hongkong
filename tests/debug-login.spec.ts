import { test, expect } from '@playwright/test';

test('debug manual login flow', async ({ page }) => {
  await page.goto('/login');

  // Fill the form with dummy data string to see if any network error is caught
  await page.fill('input[name="email"]', 'test-manual@east.com');
  await page.fill('input[name="password"]', 'test-password-123');

  // Listen for the specific network response to Auth
  const responsePromise = page.waitForResponse(response =>
    response.url().includes('supabase.co/auth/v1/token') && response.status() !== 200
  );

  await page.click('button:has-text("LOGIN")');

  try {
    const errorResponse = await responsePromise;
    const body = await errorResponse.json();
    console.log("Caught Supabase Auth Error:", body);
  } catch (e) {
    console.log("No explicit API error caught or it succeeded.");
  }
});
