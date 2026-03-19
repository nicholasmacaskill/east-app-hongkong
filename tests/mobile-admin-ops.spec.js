const { test, expect } = require('@playwright/test');

test('Mobile responsiveness test for admin-ops', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
  
  // Navigate to the page
  await page.goto('https://eastapp.booking.dynevents.com/admin-ops');
  
  // Wait a moment for any redirects or loading
  await page.waitForTimeout(3000);
  
  // Take a screenshot
  await page.screenshot({ path: 'mobile-admin-ops-test.png', fullPage: true });
  
  // Check if we're on the admin page or redirected
  const url = page.url();
  console.log('Final URL:', url);
  
  // Get page title or content to verify what we're seeing
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for common admin panel elements
  const adminContent = await page.textContent('body');
  console.log('Page content preview:', adminContent?.substring(0, 200));
});
