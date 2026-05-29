import { test, expect } from '@playwright/test';

test.describe('Wallet Screen - Lifetime Visits Tracker', () => {
  test('should display the LIFETIME VISITS tracker in the QR wallet', async ({ page }) => {
    // Go to the home page with the QR tab active
    await page.goto('/?tab=qr');
    
    // Wait for the Wallet header to appear, ensuring the screen is rendered
    await expect(page.locator('h2:has-text("WALLET")')).toBeVisible({ timeout: 10000 });
    
    // Verify the new check-ins metrics block is displayed
    const visitsHeader = page.locator('text=LIFETIME VISITS');
    await expect(visitsHeader).toBeVisible();
    
    // Verify that the count format "X Check-Ins" is displayed
    const checkInsLabel = page.locator('text=Check-Ins');
    await expect(checkInsLabel).toBeVisible();
    
    // Verify the CheckCircle2 icon container is rendered (it contains a Check icon or similar class, but just asserting the parent box is fine)
    // The metric box contains the Check-Ins text, let's verify it has some number before it.
    // We can do this by asserting the text matches the pattern of a number followed by "Check-Ins"
    const countContainer = checkInsLabel.locator('..'); // Get parent span
    const textContent = await countContainer.textContent();
    expect(textContent).toMatch(/[0-9]+\s*Check-Ins/);
  });
});
