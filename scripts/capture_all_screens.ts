import { chromium, devices } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = '/Users/nicholasmacaskill/.gemini/antigravity-ide/brain/571dd6de-42f5-429a-bfa7-974e08fef35e/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

interface ScreenTarget {
  name: string;
  path: string;
  waitMs?: number;
  waitForSelector?: string;
  fullPage?: boolean;
}

const SCREENS: ScreenTarget[] = [
  { name: '01_landing_portal', path: '/', waitMs: 2500 },
  { name: '02_membership_plans', path: '/membership', waitMs: 1500 },
  { name: '03_credit_topup', path: '/top-up', waitMs: 1500 },
  { name: '04_player_leaderboards', path: '/stats', waitMs: 2000 },
  { name: '05_schedule_calendar', path: '/calendar', waitMs: 2000 },
  { name: '06_qr_scanner_checkin', path: '/check-in', waitMs: 1500 },
  { name: '07_faq_knowledgebase', path: '/faq', waitMs: 1500 },
  { name: '08_admin_login', path: '/admin-login', waitMs: 1500 },
  { name: '09_terms_of_service', path: '/terms', waitMs: 1000 },
  { name: '10_privacy_policy', path: '/privacy', waitMs: 1000 },
  { name: '11_support_contact', path: '/support', waitMs: 1000 },
];

async function captureAll() {
  console.log('🚀 Starting screen capture harness...');
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Browser (1280x800)
  const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // 2. Mobile Browser (iPhone 14 Pro 393x852)
  const mobileContext = await browser.newContext({ ...devices['iPhone 14 Pro'] });
  const mobilePage = await mobileContext.newPage();

  for (const screen of SCREENS) {
    console.log(`📸 Capturing: ${screen.name} (${screen.path})...`);

    // A. Anaheim Jr. Ducks Desktop
    try {
      const url = `http://localhost:3000${screen.path}${screen.path.includes('?') ? '&' : '?'}tenant=jrducks`;
      await desktopPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await desktopPage.waitForTimeout(screen.waitMs || 1500);
      const destDesktop = path.join(SCREENSHOT_DIR, `${screen.name}_jrducks_desktop.png`);
      await desktopPage.screenshot({ path: destDesktop, fullPage: screen.fullPage ?? false });
      console.log(`   ✓ Jr Ducks Desktop: ${destDesktop}`);
    } catch (err: any) {
      console.warn(`   ⚠️ Error capturing Jr Ducks desktop ${screen.path}: ${err.message}`);
    }

    // B. Anaheim Jr. Ducks Mobile
    try {
      const url = `http://localhost:3000${screen.path}${screen.path.includes('?') ? '&' : '?'}tenant=jrducks`;
      await mobilePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await mobilePage.waitForTimeout(screen.waitMs || 1500);
      const destMobile = path.join(SCREENSHOT_DIR, `${screen.name}_jrducks_mobile.png`);
      await mobilePage.screenshot({ path: destMobile, fullPage: screen.fullPage ?? false });
      console.log(`   ✓ Jr Ducks Mobile:  ${destMobile}`);
    } catch (err: any) {
      console.warn(`   ⚠️ Error capturing Jr Ducks mobile ${screen.path}: ${err.message}`);
    }

    // C. EAST Sports Group Desktop (for side-by-side reference on key screens)
    if (['01_landing_portal', '02_membership_plans', '03_credit_topup', '04_player_leaderboards'].includes(screen.name)) {
      try {
        const url = `http://localhost:3000${screen.path}${screen.path.includes('?') ? '&' : '?'}tenant=east`;
        await desktopPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await desktopPage.waitForTimeout(screen.waitMs || 1500);
        const destEast = path.join(SCREENSHOT_DIR, `${screen.name}_east_desktop.png`);
        await desktopPage.screenshot({ path: destEast, fullPage: screen.fullPage ?? false });
        console.log(`   ✓ EAST Desktop:     ${destEast}`);
      } catch (err: any) {
        console.warn(`   ⚠️ Error capturing EAST desktop ${screen.path}: ${err.message}`);
      }
    }
  }

  await browser.close();
  console.log('🎉 Completed capturing all screens!');
}

captureAll();
