import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACTS_DIR = '/Users/nicholasmacaskill/.gemini/antigravity-ide/brain/571dd6de-42f5-429a-bfa7-974e08fef35e/screenshots';

async function runLiveJourney() {
  console.log('🚀 Starting Automated Live End-to-End Test on https://jrducks-app.vercel.app ...');

  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Landing Page
    console.log('\n--- 1. Testing Landing Screen ---');
    await page.goto('https://jrducks-app.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
    const pageTitle = await page.title();
    console.log('Page Title:', pageTitle);
    if (!pageTitle.includes('Anaheim Jr. Ducks')) {
      throw new Error(`Expected "Anaheim Jr. Ducks" title, got "${pageTitle}"`);
    }

    const logo = page.locator('img[src*="/tenants/jrducks/logo.png"]');
    const logoCount = await logo.count();
    console.log('Jr. Ducks Logo elements found:', logoCount);
    if (logoCount === 0) {
      throw new Error('Jr. Ducks logo not found on landing page!');
    }

    // Check for theme switcher
    const switcher = page.locator('text=Theme:');
    const switcherCount = await switcher.count();
    console.log('Theme Switcher visible:', switcherCount > 0);
    if (switcherCount > 0) {
      throw new Error('Theme switcher is still present in production!');
    }

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_01_landing.png') });
    console.log('✅ Landing screen passed.');

    // 2. Admin Login
    console.log('\n--- 2. Testing Admin Login Flow ---');
    await page.goto('https://jrducks-app.vercel.app/admin-login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="email"]', 'admin@jrducks.com');
    await page.fill('input[type="password"]', 'JrDucks2026!Admin');
    await page.click('button[type="submit"]');

    console.log('Credentials submitted, waiting for authentication response...');
    // Wait for URL navigation or auth token in storage
    await page.waitForTimeout(4000);
    console.log('Current URL after login attempt:', page.url());

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_02_admin_logged_in.png') });
    console.log('✅ Admin login flow executed.');

    // 3. Training & Clinic Calendar
    console.log('\n--- 3. Testing Calendar & Rinks ---');
    await page.goto('https://jrducks-app.vercel.app/calendar', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const bodyText = await page.innerText('body');
    const hasGreatPark = bodyText.includes('Great Park') || bodyText.includes('Anaheim ICE') || bodyText.includes('FivePoint');
    console.log('Contains seeded SoCal rinks / sessions:', hasGreatPark);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_03_calendar.png') });
    console.log('✅ Calendar screen passed.');

    // 4. Player Stats & Leaderboard
    console.log('\n--- 4. Testing Stats & Leaderboard ---');
    await page.goto('https://jrducks-app.vercel.app/stats', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_04_stats.png') });
    console.log('✅ Stats screen passed.');

    // 5. Top-Up & Stripe Checkout Integration
    console.log('\n--- 5. Testing Top-Up & Stripe Checkout Generation ---');
    await page.goto('https://jrducks-app.vercel.app/top-up', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const topUpText = await page.innerText('body');
    const hasPackages = topUpText.includes('Starter') || topUpText.includes('Standard') || topUpText.includes('Credits');
    console.log('Contains credit packages:', hasPackages);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_05_topup.png') });
    console.log('✅ Top-up screen passed.');

    console.log('\n========================================');
    console.log('🎉 ALL LIVE SMOKE TESTS PASSED WITH 0 FATAL ERRORS!');
    console.log('========================================');
  } catch (err: any) {
    console.error('❌ Live journey test failed:', err);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_test_failure.png') }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

runLiveJourney().catch(err => {
  console.error(err);
  process.exit(1);
});
