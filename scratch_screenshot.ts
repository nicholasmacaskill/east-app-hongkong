import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to stats page
  await page.goto('http://localhost:3001/stats');
  await page.waitForTimeout(3000); // Wait for data to load
  await page.screenshot({ path: '/Users/nicholasmacaskill/.gemini/antigravity/brain/93d68147-bcb6-4a55-952b-38d89dfb9aab/artifacts/leaderboard.png', fullPage: true });

  // Let's create a mock profile state or try to login to take a profile screenshot.
  // The easiest way to get the profile UI without logging in is to intercept the auth request or mock it,
  // but it's complex. Let's just create a test user, login, and screenshot.
  
  await browser.close();
  console.log("Screenshot taken successfully.");
})();
