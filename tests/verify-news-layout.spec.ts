import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 375, height: 812 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
});

test('verify news page mobile layout', async ({ page }) => {
  // Login first (mocked)
  await page.goto('http://localhost:3000/auth/login');
  
  // Navigate to News Management
  await page.goto('http://localhost:3000/sys-admin/news');
  await page.waitForTimeout(3000); // Wait for animations
  
  // Take screenshot of header area specifically
  await page.locator('.flex.flex-col.gap-2').first().screenshot({ path: 'news-mobile-header.png' });
  
  // Take full page screenshot
  await page.screenshot({ path: 'news-mobile-full.png', fullPage: true });
});
