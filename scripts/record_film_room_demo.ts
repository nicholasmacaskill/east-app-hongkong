import { chromium, Page } from 'playwright';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = '/Users/nicholasmacaskill/.gemini/antigravity-ide/brain/7f9edfc3-423e-4ba7-8ada-a1f9f3303f6f';
const TEMP_VIDEO_DIR = path.resolve(__dirname, '../tmp/film_room_recordings');
const FINAL_MP4_PATH = path.join(ARTIFACT_DIR, 'film_room_walkthrough.mp4');
const DESKTOP_MP4_PATH = '/Users/nicholasmacaskill/Desktop/EastApp_FilmRoom_Walkthrough.mp4';

interface CaptionPayload {
  badge: string;
  title: string;
  text: string;
  accentColor?: string;
}

// Injects or updates the floating broadcast HUD caption card
async function setCaption(page: Page, caption: CaptionPayload, waitMs: number = 4000) {
  console.log(`\n📢 [HUD: ${caption.badge}] ${caption.title}`);
  console.log(`   "${caption.text}"`);

  await page.evaluate(({ badge, title, text, accentColor }) => {
    let container = document.getElementById('east-caption-hud');
    if (!container) {
      container = document.createElement('div');
      container.id = 'east-caption-hud';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(0);
        z-index: 2147483647;
        pointer-events: none;
        width: 90%;
        max-width: 880px;
        background: rgba(10, 10, 10, 0.94);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(40, 209, 96, 0.6);
        border-radius: 14px;
        padding: 14px 22px;
        box-shadow: 0 16px 50px rgba(0, 0, 0, 0.95), 0 0 30px rgba(40, 209, 96, 0.25);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #ffffff;
        transition: opacity 0.35s ease, transform 0.35s ease;
        opacity: 0;
      `;
      document.body.appendChild(container);
    }

    container.style.opacity = '0';
    container.style.transform = 'translateX(-50%) translateY(6px)';

    setTimeout(() => {
      if (!container) return;
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; pointer-events: none;">
          <div style="display: flex; align-items: center; gap: 10px; pointer-events: none;">
            <span style="
              background: ${accentColor || '#28D160'};
              color: #000000;
              font-size: 10.5px;
              font-weight: 900;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              padding: 3px 9px;
              border-radius: 5px;
              display: inline-block;
            ">${badge}</span>
            <span style="
              color: #FFFFFF;
              font-size: 13.5px;
              font-weight: 800;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            ">${title}</span>
          </div>
          <span style="
            color: #28D160;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          ">EAST APP HK</span>
        </div>
        <p style="
          margin: 0;
          color: #E2E8F0;
          font-size: 13px;
          line-height: 1.4;
          font-weight: 500;
          pointer-events: none;
        ">${text}</p>
      `;

      container.style.opacity = '1';
      container.style.transform = 'translateX(-50%) translateY(0)';
    }, 120);
  }, caption);

  await page.waitForTimeout(waitMs);
}

async function hideCaption(page: Page) {
  await page.evaluate(() => {
    const container = document.getElementById('east-caption-hud');
    if (container) {
      container.style.opacity = '0';
      container.remove();
    }
  });
  await page.waitForTimeout(300);
}

(async () => {
  console.log('🎬 Starting Film Room Video Walkthrough Recording...');

  if (!fs.existsSync(TEMP_VIDEO_DIR)) {
    fs.mkdirSync(TEMP_VIDEO_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: TEMP_VIDEO_DIR,
      size: { width: 1280, height: 800 }
    }
  });

  const page = await context.newPage();

  try {
    // ----------------------------------------------------
    // SCENE 1: LOGIN & AUTHENTICATION
    // ----------------------------------------------------
    console.log('--- SCENE 1: Coach Login ---');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1500);

    await setCaption(page, {
      badge: 'COACH ACCESS',
      title: 'Tactical Film Suite Launch',
      text: 'Logging into East App HK as a Coach to access the newly integrated Film Room and tactical breakdown hub.'
    }, 3500);

    await page.fill('input[type="email"]', 'coach.demo@eastsportsgroup.com');
    await page.waitForTimeout(400);
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.waitForTimeout(600);
    await page.click('button[type="submit"]');

    // Wait for Coach Dashboard to fully render
    const filmRoomTab = page.locator('button:has-text("Film Room")').first();
    await filmRoomTab.waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForTimeout(2000);

    // ----------------------------------------------------
    // SCENE 2: FILM ROOM HUB & NAVIGATION
    // ----------------------------------------------------
    console.log('--- SCENE 2: Navigating to Film Room Hub ---');
    await setCaption(page, {
      badge: 'FILM ROOM HUB',
      title: 'Dedicated Tactical Center',
      text: 'Replacing the manual notebook workflow: all YouTube coaching sessions are organized in one central hub.'
    }, 3500);

    await filmRoomTab.click();
    await page.waitForTimeout(2000);

    await setCaption(page, {
      badge: 'ORGANIZATION',
      title: 'Search, Filter & Target Squads',
      text: 'Filter sessions across All Squads, Specific Teams, or Individual Athlete reviews with real-time search.'
    }, 3500);

    // Hover search & filter pills
    const searchInput = page.locator('input[placeholder*="Search film"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.hover();
      await page.waitForTimeout(800);
    }

    // Filter bar
    const teamFilter = page.getByRole('button', { name: 'Teams', exact: true });
    if (await teamFilter.isVisible()) {
      await teamFilter.click();
      await page.waitForTimeout(1000);
    }

    const allFilter = page.getByRole('button', { name: 'All', exact: true });
    if (await allFilter.isVisible()) {
      await allFilter.click();
      await page.waitForTimeout(1000);
    }

    // ----------------------------------------------------
    // SCENE 3: INTERACTIVE THEATER & SYNCHRONIZED NOTES
    // ----------------------------------------------------
    console.log('--- SCENE 3: Opening Session & Interactive Theater ---');
    const sessionCard = page.locator('text=Game 3 Breakdown').first();
    await sessionCard.waitFor({ state: 'visible', timeout: 10000 });
    await sessionCard.click();
    await page.waitForTimeout(2500);

    await setCaption(page, {
      badge: 'INTERACTIVE THEATER',
      title: 'Synchronized Video & Coaching Notes',
      text: 'Video plays on the left while tactical notes stay perfectly synchronized on the right with glowing active indicators.'
    }, 4500);

    // Click cue 1: 00:15
    console.log('Tapping cue 00:15...');
    const cue1 = page.locator('text=Shoulder Check & Gap Control').first();
    if (await cue1.isVisible()) {
      await cue1.click();
      await page.waitForTimeout(2500);
    }

    // Click cue 2: 00:45
    console.log('Tapping cue 00:45...');
    await setCaption(page, {
      badge: 'INSTANT SEEK',
      title: 'Tap Any Timestamp to Jump',
      text: 'Clicking any cue immediately seeks the embedded YouTube player to that exact second—no manual scrubbing required.'
    }, 3500);

    const cue2 = page.locator('text=D-to-D Reverse Execution').first();
    if (await cue2.isVisible()) {
      await cue2.click();
      await page.waitForTimeout(2500);
    }

    // Click Next Marker button
    console.log('Clicking Next Marker step control...');
    const nextBtn = page.locator('button:has-text("Next Marker")').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(2500);
    }

    // Highlight 1-tap YouTube fallback
    await setCaption(page, {
      badge: 'DIRECT FALLBACK',
      title: 'One-Tap YouTube App Link',
      text: 'Need full native YouTube controls? One tap launches the YouTube app or browser tab at the exact timestamp with ?t=XXs.'
    }, 4000);

    const ytLink = page.locator('a:has-text("Watch in YouTube")').first();
    if (await ytLink.isVisible()) {
      await ytLink.hover();
      await page.waitForTimeout(1500);
    }

    // Close session modal
    await hideCaption(page);
    await page.locator('button[title="Close"]').first().click({ force: true });
    await page.waitForTimeout(1500);

    // ----------------------------------------------------
    // SCENE 4: CREATING A NEW SESSION (LIVE PREVIEW & GRAB)
    // ----------------------------------------------------
    console.log('--- SCENE 4: Rapid Creation Modal ---');
    const newBtn = page.locator('button:has-text("New Film Session")').first();
    await newBtn.click();
    await page.waitForTimeout(1500);

    await setCaption(page, {
      badge: 'RAPID WORKFLOW',
      title: 'Add Video & Capture Cues on the Fly',
      text: 'Paste any YouTube URL. East App embeds an interactive preview with a "+ Grab Current Time" button for zero-effort tagging.'
    }, 4500);

    const urlInput = page.locator('input[placeholder*="youtube.com"]').first();
    await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await page.waitForTimeout(2000);

    // Fill title & objective
    const titleInput = page.locator('input[placeholder*="Game 3 Neutral Zone"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Neutral Zone Forecheck & Gap Control');
      await page.waitForTimeout(1000);
    }

    const descInput = page.locator('input[placeholder*="Focus on D-to-D"]').first();
    if (await descInput.isVisible()) {
      await descInput.fill('Detailed video breakdown of F1 pressure and D-partner gap maintenance.');
      await page.waitForTimeout(1000);
    }

    // Add a cue
    const addCueBtn = page.locator('button:has-text("Add Marker")').first();
    if (await addCueBtn.isVisible()) {
      await addCueBtn.click();
      await page.waitForTimeout(1000);

      const timeInput = page.locator('input[placeholder="01:23"]').last();
      const cueTitleInput = page.locator('input[placeholder*="Play / Concept title"]').last();
      const cueNotesInput = page.locator('textarea[placeholder*="Coaching notes"]').last();

      if (await timeInput.isVisible()) await timeInput.fill('00:35');
      if (await cueTitleInput.isVisible()) await cueTitleInput.fill('Angling F1 on the boards');
      if (await cueNotesInput.isVisible()) await cueNotesInput.fill('Drive with inside edge and take away center ice lane.');
      await page.waitForTimeout(2000);
    }

    await setCaption(page, {
      badge: 'ROLES & TARGETING',
      title: 'Squad, Team or Private Athlete',
      text: 'Assign to the entire club, specific roster teams, or private 1-on-1 athlete profiles with automatic access enforcement.'
    }, 4000);

    // Cancel / Close create modal
    await hideCaption(page);
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click({ force: true });
      await page.waitForTimeout(1500);
    }

    // ----------------------------------------------------
    // SCENE 5: CHAT INTEGRATION & CONCLUSION
    // ----------------------------------------------------
    console.log('--- SCENE 5: Chat Integration & Summary ---');
    const shareBtn = page.locator('button[title="Share Film Session"]').first();
    if (await shareBtn.isVisible()) {
      await setCaption(page, {
        badge: 'CHAT INTEGRATION',
        title: 'Share Directly in Private Messenger',
        text: 'Coaches can send interactive film cards straight into athlete or squad group chats with a single tap.'
      }, 4000);

      await hideCaption(page);
      await shareBtn.click({ force: true });
      await page.waitForTimeout(3000);
    }

    await setCaption(page, {
      badge: 'PRODUCTION READY',
      title: 'East App HK Film Room Live',
      text: 'Fully verified with automated Playwright tests, zero TypeScript errors, secure RLS, and responsive design.'
    }, 4500);

    await hideCaption(page);
    await page.waitForTimeout(1000);

    console.log('✅ Recording completed successfully.');
  } catch (err) {
    console.error('Recording error:', err);
  } finally {
    // Close context to finalize video writing
    await context.close();
    await browser.close();
  }

  // Find recorded webm file
  const videoFiles = fs.readdirSync(TEMP_VIDEO_DIR)
    .filter(f => f.endsWith('.webm'))
    .map(f => ({
      name: f,
      path: path.join(TEMP_VIDEO_DIR, f),
      time: fs.statSync(path.join(TEMP_VIDEO_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (videoFiles.length > 0) {
    const rawWebm = videoFiles[0].path;
    console.log(`🎥 Raw recording saved to: ${rawWebm}`);

    try {
      console.log('⚙️ Converting WebM to optimized MP4 with ffmpeg...');
      execSync(`/opt/homebrew/bin/ffmpeg -y -i "${rawWebm}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 22 "${FINAL_MP4_PATH}"`, { stdio: 'inherit' });
      console.log(`✅ Artifact MP4 saved to: ${FINAL_MP4_PATH}`);

      // Also copy to desktop for user convenience
      fs.copyFileSync(FINAL_MP4_PATH, DESKTOP_MP4_PATH);
      console.log(`✅ Desktop copy saved to: ${DESKTOP_MP4_PATH}`);
    } catch (ffmpegErr) {
      console.error('FFmpeg conversion error:', ffmpegErr);
    }
  } else {
    console.error('No video files recorded in:', TEMP_VIDEO_DIR);
  }
})();
