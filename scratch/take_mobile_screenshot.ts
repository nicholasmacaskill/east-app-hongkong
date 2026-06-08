import { chromium, devices } from 'playwright';
import * as path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  // Emulate iPhone 13
  const context = await browser.newContext(devices['iPhone 13']);
  const page = await context.newPage();
  
  // Try port 3000 first, then 3001
  let targetUrl = 'http://localhost:3000/drill-hub';
  try {
    await page.goto(targetUrl, { timeout: 10000 });
  } catch (e) {
    console.log("Port 3000 failed, trying 3001...");
    targetUrl = 'http://localhost:3001/drill-hub';
    try {
      await page.goto(targetUrl, { timeout: 10000 });
    } catch (err) {
      console.log("Port 3001 failed too. Exiting.");
      await browser.close();
      process.exit(1);
    }
  }

  console.log(`Connected to ${targetUrl}`);
  
  // Wait for drills to load. The images might take a sec to load
  await page.waitForTimeout(5000); 

  // Take screenshot
  const screenshotPath = '/Users/nicholasmacaskill/.gemini/antigravity/artifacts/drill_hub_mobile.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await browser.close();
  console.log(`Screenshot saved to ${screenshotPath}`);
})();
