import { chromium, Page } from 'playwright';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'https://jrducks-app.vercel.app';
const DESKTOP_OUTPUT_MP4 = '/Users/nicholasmacaskill/Desktop/JrDucks_Full_Platform_Demo.mp4';
const TEMP_VIDEO_DIR = path.resolve(__dirname, '../tmp/video_recordings');

interface CaptionPayload {
  badge: string;
  title: string;
  text: string;
  accentColor?: string;
}

// Injects or updates the floating broadcast HUD caption card
async function setCaption(page: Page, caption: CaptionPayload, waitMs: number = 4500) {
  console.log(`\n📢 [CAPTION: ${caption.badge}] ${caption.title}`);
  console.log(`   "${caption.text}"`);

  await page.evaluate(({ badge, title, text, accentColor }) => {
    let container = document.getElementById('pm-caption-card');
    if (!container) {
      container = document.createElement('div');
      container.id = 'pm-caption-card';
      container.style.cssText = `
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(0);
        z-index: 2147483647;
        pointer-events: none;
        width: 90%;
        max-width: 920px;
        background: rgba(10, 10, 10, 0.94);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(252, 76, 2, 0.45);
        border-radius: 16px;
        padding: 16px 24px;
        box-shadow: 0 16px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(252, 76, 2, 0.2);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #ffffff;
        transition: opacity 0.35s ease, transform 0.35s ease;
        opacity: 0;
      `;
      document.body.appendChild(container);
    }

    // Fade out briefly for smooth update
    container.style.opacity = '0';
    container.style.transform = 'translateX(-50%) translateY(-6px)';

    setTimeout(() => {
      if (!container) return;
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="
              background: ${accentColor || '#FC4C02'};
              color: #000000;
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              padding: 4px 10px;
              border-radius: 6px;
              display: inline-block;
            ">${badge}</span>
            <span style="
              color: #FFFFFF;
              font-size: 14px;
              font-weight: 800;
              letter-spacing: 0.06em;
              text-transform: uppercase;
            ">${title}</span>
          </div>
          <span style="
            color: #B9975B;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          ">ANAHEIM JR. DUCKS</span>
        </div>
        <p style="
          margin: 0;
          color: #E2E8F0;
          font-size: 13.5px;
          line-height: 1.45;
          font-weight: 500;
          letter-spacing: -0.01em;
        ">${text}</p>
      `;

      container.style.opacity = '1';
      container.style.transform = 'translateX(-50%) translateY(0)';
    }, 150);
  }, caption);

  await page.waitForTimeout(waitMs);
}

async function smoothScroll(page: Page, yDistance: number, steps: number = 8) {
  const stepDist = yDistance / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, stepDist);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(600);
}

async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
  await page.waitForTimeout(1000);
}

async function runDemoRecording() {
  console.log('🦆 ========================================================');
  console.log('🦆 ANAHEIM JR. DUCKS FULL-PLATFORM PM WALKTHROUGH RECORDING');
  console.log('🦆 ========================================================');

  if (!fs.existsSync(TEMP_VIDEO_DIR)) {
    fs.mkdirSync(TEMP_VIDEO_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    slowMo: 650
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: TEMP_VIDEO_DIR,
      size: { width: 1920, height: 1080 }
    },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  // Dialog auto-accept
  page.on('dialog', async dialog => {
    console.log(`Accepted dialog: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    // -------------------------------------------------------------
    // ACT 0: INTRO & PORTAL SELECTION
    // -------------------------------------------------------------
    console.log('\n--- ACT 0: INTRO SCREEN ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await clearAuth(page);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    await setCaption(page, {
      badge: 'PLATFORM OVERVIEW',
      title: 'ANAHEIM JR. DUCKS UNIFIED DIGITAL ECOSYSTEM',
      text: 'A unified athletic operating system purpose-built for elite youth hockey organizations—bringing coaches, athletes, families, and executive directors into one synchronized platform.'
    }, 5500);

    await smoothScroll(page, 200, 5);
    await page.waitForTimeout(1000);
    await smoothScroll(page, -200, 5);

    // -------------------------------------------------------------
    // ACT 1: COACH PORTAL & INTERACTIVE DRILL HUB
    // -------------------------------------------------------------
    console.log('\n--- ACT 1: COACH PORTAL (Scott Niedermayer) ---');
    await page.click('[data-testid="coach-portal-section"] button:has-text("LOGIN")');
    await page.waitForTimeout(1500);

    await page.fill('input[type="email"]', 'scott.niedermayer@jrducks.com');
    await page.fill('input[type="password"]', 'JrDucks2026!Coach');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    await setCaption(page, {
      badge: 'COACH PORTAL',
      title: 'UNIFIED PRACTICE & SCHEDULE COMMAND',
      text: 'Eliminates fragmented spreadsheets and group chats. Coaching directors gain instantaneous visibility into daily ice allocations, assigned clinics, and roster sizes across every Jr. Ducks facility.'
    }, 5500);

    await smoothScroll(page, 350, 8);
    await page.waitForTimeout(1500);
    await smoothScroll(page, -350, 8);
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------
    // SCENE 1.1: COACH TACTICAL FILM ROOM & INTERACTIVE THEATER
    // -------------------------------------------------------------
    console.log('Navigating to Film Room Tab...');
    const filmRoomTab = page.locator('button:has-text("Film Room")').first();
    await filmRoomTab.waitFor({ state: 'visible', timeout: 15000 });
    await filmRoomTab.click();
    await page.waitForTimeout(2000);

    await setCaption(page, {
      badge: 'FILM ROOM',
      title: 'TACTICAL VIDEO PLAYBOOK & CUES',
      text: 'Replaces scattered video links with an integrated hockey video theater. Coaches curate game clips with synchronized tactical cues for the entire Jr. Ducks roster.'
    }, 5500);

    // Open signature Anaheim Jr. Ducks breakdown session
    console.log('Opening Anaheim Jr. Ducks tactical film session...');
    const sessionCard = page.locator('text=Anaheim Jr. Ducks').first();
    await sessionCard.waitFor({ state: 'visible', timeout: 10000 });
    await sessionCard.click();
    await page.waitForTimeout(2500);

    await setCaption(page, {
      badge: 'SYNCHRONIZED THEATER',
      title: 'INSTANT CUE SEEK & ON-ICE NOTES',
      text: 'Clicking any marker jumps the embedded YouTube player directly to the exact play second with zero scrubbing—reinforcing defensive gap control and forechecking assignments.'
    }, 5500);

    // Tap cue 1: 00:15
    const cue1 = page.locator('text=F1 Angling & Neutral Zone Lock').first();
    if (await cue1.isVisible()) {
      await cue1.click();
      await page.waitForTimeout(2500);
    }

    // Tap Next Marker button
    const nextMarkerBtn = page.locator('button:has-text("Next Marker")').first();
    if (await nextMarkerBtn.isVisible()) {
      await nextMarkerBtn.click();
      await page.waitForTimeout(2500);
    }

    // Hover Direct YouTube Link
    const ytLink = page.locator('a:has-text("Watch in YouTube")').first();
    if (await ytLink.isVisible()) {
      await ytLink.hover();
      await page.waitForTimeout(1500);
    }

    // Close theater modal
    const closeBtn = page.locator('button[title="Close"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(1500);
    }

    // Navigate to Drill Hub
    console.log('Navigating to Drill Hub...');
    await page.goto(`${BASE_URL}/drill-hub`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await setCaption(page, {
      badge: 'DRILL HUB',
      title: 'STANDARDIZED DIGITAL CURRICULUM',
      text: 'Transforms institutional hockey IQ into reusable digital assets. Standardizes development drills across all age tiers—from 8U Mites to 18U AAA—so every coach teaches the same club blueprint.'
    }, 5500);

    // Click on a drill card or interaction
    try {
      const drillCard = page.locator('h3, .group, [role="button"]').filter({ hasText: /Demo|Explosive|Skating|Puck/i }).first();
      if (await drillCard.count() > 0) {
        await drillCard.click();
        await page.waitForTimeout(2500);
      }
    } catch (e) {
      console.log('Drill card click skipped/handled');
    }

    await setCaption(page, {
      badge: 'TACTICAL BUILDER',
      title: 'MULTI-PHASE VISUAL PLAYBOOK',
      text: 'Bridges whiteboard strategy with on-ice execution. Coaches architect step-by-step visual breakdowns with skating lanes, puck movement, and coaching cues in seconds.'
    }, 5000);

    // Switch between tabs if available
    try {
      const streamBtn = page.locator('button:has-text("Analysis Stream")');
      if (await streamBtn.count() > 0) {
        await streamBtn.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {}

    await setCaption(page, {
      badge: 'SESSION SYNC',
      title: 'PRE-PRACTICE TACTICAL DISPATCH',
      text: 'Unlocks 15+ minutes of active ice time per practice. Attaches drill plans directly to registered sessions, ensuring athletes study tactics before their skates touch the ice.'
    }, 4500);

    await clearAuth(page);

    // -------------------------------------------------------------
    // ACT 2: ATHLETE EXPERIENCE (Trevor Zegras Jr.)
    // -------------------------------------------------------------
    console.log('\n--- ACT 2: ATHLETE EXPERIENCE (Trevor Zegras Jr.) ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    await page.click('[data-testid="athlete-portal-section"] button:has-text("LOGIN")');
    await page.waitForTimeout(1500);

    await page.fill('input[type="email"]', 'trevor.zegras.jr@jrducks.com');
    await page.fill('input[type="password"]', 'JrDucks2026!Player');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    await setCaption(page, {
      badge: 'ATHLETE EXPERIENCE',
      title: 'PERSONALIZED MOBILE COMMAND CENTER',
      text: 'Drives daily athlete engagement through a sleek, mobile-first experience that surfaces priority club bulletins, upcoming ice times, and developmental milestones.'
    }, 5500);

    await smoothScroll(page, 300, 6);
    await page.waitForTimeout(1200);

    // Click Schedule tab
    console.log('Navigating to Athlete Schedule...');
    try {
      await page.click('button:has-text("Schedule")');
    } catch(e) {
      await page.goto(`${BASE_URL}/?tab=schedule`);
    }
    await page.waitForTimeout(3000);

    await setCaption(page, {
      badge: 'ICE BOOKING',
      title: 'FRICTIONLESS CREDIT-BASED ICE RESERVATIONS',
      text: 'Removes registration friction. Athletes and families book high-tempo skating and skills clinics with 1-click credit redemption, maximizing ice capacity across every rink.'
    }, 5500);

    await smoothScroll(page, 250, 6);
    await page.waitForTimeout(1500);

    // Check for "VIEW PLAN"
    try {
      const viewPlanBtn = page.locator('button:has-text("VIEW PLAN")').first();
      if (await viewPlanBtn.count() > 0) {
        await viewPlanBtn.click();
        await page.waitForTimeout(3000);

        await setCaption(page, {
          badge: 'TACTICAL PREVIEW',
          title: 'PRE-PRACTICE MENTAL PREPARATION',
          text: 'Maximizes expensive ice time: players review Coach Niedermayer\'s tactical animations directly on their phone before stepping on the ice, eliminating whiteboard downtime.'
        }, 5000);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    } catch(e) {}

    // Navigate to Stats Lab
    console.log('Navigating to Stats & Leaderboards...');
    await page.goto(`${BASE_URL}/stats`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await setCaption(page, {
      badge: 'PERFORMANCE LAB',
      title: 'OBJECTIVE SKILL BENCHMARKING',
      text: 'Boosts retention and competitive drive through quantified athletic metrics—benchmarking top skating speed, shot velocity, and team rankings across the organization.'
    }, 5500);

    await smoothScroll(page, 300, 6);
    await page.waitForTimeout(1500);
    await smoothScroll(page, -300, 6);

    // Navigate to QR Pass
    console.log('Navigating to Digital QR Pass...');
    await page.goto(`${BASE_URL}/?tab=qr`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await setCaption(page, {
      badge: 'GATE ACCESS',
      title: 'CONTACTLESS QR FACILITY CHECK-IN',
      text: 'Eliminates check-in bottlenecks at the rink. Contactless QR scanning authenticates athlete registration and deducts session credits in under two seconds.'
    }, 5000);

    // Navigate to Profile
    console.log('Navigating to Athlete Profile...');
    await page.goto(`${BASE_URL}/?tab=profile`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await setCaption(page, {
      badge: 'ATHLETE IDENTITY',
      title: 'COMPREHENSIVE PLAYER PROFILE & GEAR',
      text: 'Builds athlete pride and accountability by tracking personal achievements, jersey numbers, stick specs, and verified development history in one digital passport.'
    }, 5000);

    await smoothScroll(page, 200, 5);
    await page.waitForTimeout(1500);

    // Open Athlete Film Room from Settings
    console.log('Opening Athlete Film Room review...');
    try {
      const settingsBtn = page.locator('[data-testid="settings-button"]').first();
      if (await settingsBtn.isVisible()) {
        await settingsBtn.click();
        await page.waitForTimeout(1500);

        const athleteFilmItem = page.locator('[data-testid="menu-item-film-room"], button:has-text("Film Room")').first();
        if (await athleteFilmItem.isVisible()) {
          await athleteFilmItem.click();
          await page.waitForTimeout(2000);

          await setCaption(page, {
            badge: 'ATHLETE FILM ACCESS',
            title: 'ON-DEMAND TACTICAL REVIEWS',
            text: 'Athletes study assigned game footage and tactical notes from any mobile device, arriving at practice fully prepared.'
          }, 5000);

          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1200);
        }
      }
    } catch (e) {
      console.log('Athlete film room step skipped/handled:', e);
    }

    await clearAuth(page);

    // -------------------------------------------------------------
    // ACT 3: PARENT FAMILY MANAGEMENT & BILLING
    // -------------------------------------------------------------
    console.log('\n--- ACT 3: PARENT FAMILY HUB (Mark Zegras) ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    await page.click('[data-testid="parent-portal-section"] button:has-text("LOGIN")');
    await page.waitForTimeout(1500);

    await page.fill('input[type="email"]', 'parent@jrducks.com');
    await page.fill('input[type="password"]', 'JrDucks2026!Parent');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // Open Parent Profile Tab to show family management
    await page.goto(`${BASE_URL}/?tab=profile`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await setCaption(page, {
      badge: 'PARENT HUB',
      title: 'UNIFIED FAMILY COMMAND CENTER',
      text: 'Solves the logistical chaos of multi-child sports households. Parents oversee schedules, waivers, and developmental progress for multiple youth players under a single login.'
    }, 5500);

    await smoothScroll(page, 300, 6);
    await page.waitForTimeout(1500);

    // Parent Schedule Booking for children
    await page.goto(`${BASE_URL}/?tab=schedule`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await setCaption(page, {
      badge: 'SIBLING SCHEDULING',
      title: 'DELEGATED CHILD ICE ALLOCATION',
      text: 'Empowers parents to reserve ice times for specific siblings without conflicting calendars or re-entering payment credentials.'
    }, 5000);

    await smoothScroll(page, 250, 6);
    await page.waitForTimeout(1200);

    // Credit Top-Up Screen
    console.log('Navigating to Top-Up packages...');
    await page.goto(`${BASE_URL}/top-up`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await setCaption(page, {
      badge: 'FLEXIBLE BILLING',
      title: 'PRE-PAID CREDIT CASH FLOW ENGINE',
      text: 'Accelerates upfront cash flow for the club. Parents purchase tiered credit packages (Starter to Elite) with instant Stripe checkout, removing per-session payment overhead.'
    }, 5500);

    await smoothScroll(page, 350, 8);
    await page.waitForTimeout(1500);
    await smoothScroll(page, -350, 8);

    // Membership Subscriptions
    console.log('Navigating to Membership Subscriptions...');
    await page.goto(`${BASE_URL}/membership`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await setCaption(page, {
      badge: 'MEMBERSHIP TIERS',
      title: 'PREDICTABLE RECURRING SAAS REVENUE',
      text: 'Converts ad-hoc clinic attendees into predictable monthly recurring revenue with automated family subscription tiers and clear digital billing history.'
    }, 5500);

    await smoothScroll(page, 300, 6);
    await page.waitForTimeout(1500);

    await clearAuth(page);

    // -------------------------------------------------------------
    // ACT 4: EXECUTIVE ADMIN & DIRECTOR OPERATIONS
    // -------------------------------------------------------------
    console.log('\n--- ACT 4: ADMIN OPERATIONS (Director Jr Ducks) ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    await page.click('button:has-text("ADMIN PORTAL")');
    await page.waitForTimeout(1500);

    await page.fill('input[type="email"]', 'admin@jrducks.com');
    await page.fill('input[type="password"]', 'JrDucks2026!Admin');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(6000);

    await setCaption(page, {
      badge: 'DIRECTOR OPS',
      title: 'CLUB-WIDE OPERATIONAL INTELLIGENCE',
      text: 'Delivers 360-degree executive visibility. Club directors monitor total active rosters, facility capacity, credit burn rates, and daily revenue velocity in one real-time cockpit.'
    }, 6000);

    await smoothScroll(page, 350, 8);
    await page.waitForTimeout(1500);
    await smoothScroll(page, -350, 8);

    // Admin Directory
    console.log('Navigating to Admin Directory...');
    await page.goto(`${BASE_URL}/sys-admin/directory`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await setCaption(page, {
      badge: 'GOVERNANCE',
      title: 'ENTERPRISE ROLE-BASED ACCESS CONTROL (RBAC)',
      text: 'Guarantees data compliance and privacy. Strictly segregates administrative governance, coaching playbooks, and parental financial permissions.'
    }, 5500);

    await smoothScroll(page, 250, 6);
    await page.waitForTimeout(1200);

    // Admin Schedule
    console.log('Navigating to Admin Schedule...');
    await page.goto(`${BASE_URL}/sys-admin/schedule`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await setCaption(page, {
      badge: 'FACILITY SCHEDULER',
      title: 'MULTI-RINK YIELD OPTIMIZATION',
      text: 'Empowers directors to program multi-sheet ice slots across Great Park Ice and Anaheim ICE in minutes—setting capacity limits, credit costs, and instructor assignments with zero conflict.'
    }, 5500);

    await smoothScroll(page, 300, 6);
    await page.waitForTimeout(1200);

    // Admin Transactions & Financial Ledger
    console.log('Navigating to Admin Transactions...');
    await page.goto(`${BASE_URL}/sys-admin/transactions`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await setCaption(page, {
      badge: 'FINANCIAL AUDIT',
      title: 'TAMPER-EVIDENT REVENUE GOVERNANCE',
      text: 'Maintains complete financial integrity. Provides an audit-ready ledger of every credit allocation, Stripe payout, and membership renewal across the entire organization.'
    }, 5500);

    await smoothScroll(page, 250, 6);
    await page.waitForTimeout(1200);

    // -------------------------------------------------------------
    // OUTRO
    // -------------------------------------------------------------
    console.log('\n--- OUTRO ---');
    await clearAuth(page);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    await setCaption(page, {
      badge: 'ANAHEIM JR. DUCKS',
      title: 'THE COMPLETE PLATFORM FOR ELITE HOCKEY',
      text: 'From on-ice player development to enterprise multi-rink governance — purpose-built for the future of the game.'
    }, 5000);

    console.log('✅ Screen Walkthrough Complete! Saving raw video...');
    const rawVideoPath = await page.video()?.path();

    await context.close();
    await browser.close();

    if (!rawVideoPath || !fs.existsSync(rawVideoPath)) {
      throw new Error(`Raw video file not found at ${rawVideoPath}`);
    }

    console.log(`Raw WebM saved to: ${rawVideoPath}`);
    console.log(`Transcoding with ffmpeg to high-definition MP4: ${DESKTOP_OUTPUT_MP4}...`);

    execSync(`/opt/homebrew/bin/ffmpeg -y -i "${rawVideoPath}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 22 "${DESKTOP_OUTPUT_MP4}"`);
    console.log(`\n🎉 SUCCESS! Full E2E Demo Video saved to:`);
    console.log(`➡️  ${DESKTOP_OUTPUT_MP4}`);

    // Remove raw webm
    try { fs.unlinkSync(rawVideoPath); } catch(e) {}

  } catch (error) {
    console.error('❌ Recording failed:', error);
    await context.close();
    await browser.close();
    process.exit(1);
  }
}

runDemoRecording();
