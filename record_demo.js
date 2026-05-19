const { chromium } = require('playwright');
const { execSync } = require('child_process');

(async () => {
  console.log('Launching browser with slowMo for better video pacing...');
  const browser = await chromium.launch({ headless: true, slowMo: 800 });
  const context = await browser.newContext({
    recordVideo: {
      dir: __dirname,
      size: { width: 1440, height: 900 }
    }
  });
  const page = await context.newPage();
  
  // Capture browser logs
  page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
  
  // Log all network requests/responses
  page.on('request', request => {
      if (request.url().includes('api/') || request.url().includes('supabase')) {
          console.log(`REQ: ${request.method()} ${request.url()}`);
      }
  });
  page.on('response', response => {
      if (response.status() >= 400) {
          console.log(`RES ERROR: ${response.status()} ${response.url()}`);
      }
  });
  
  // Auto-accept all alerts
  page.on('dialog', async dialog => {
      console.log(`Accepted dialog: ${dialog.message()}`);
      await dialog.accept();
  });
  
  console.log('--- LOGIN FLOW ---');
  
  // 1. Mock GET /rest/v1/sessions
  await page.route('**/rest/v1/sessions*', async route => {
      if (route.request().method() === 'GET') {
          const json = [{
              id: 'mock-session-123',
              title: 'CEO Demo Training Class',
              start_time: new Date(Date.now() + 3600000).toISOString(),
              end_time: new Date(Date.now() + 7200000).toISOString(),
              instructor: 'Coach Nick',
              category: 'PERFORMANCE'
          }];
          console.log('MOCKING GET /rest/v1/sessions');
          await route.fulfill({
              contentType: 'application/json',
              body: JSON.stringify(json)
          });
      } else {
          await route.continue();
      }
  });

  // 2. Mock POST/GET /rest/v1/session_drills
  await page.route('**/rest/v1/session_drills*', async route => {
      if (route.request().method() === 'POST') {
          console.log('MOCKING POST /rest/v1/session_drills');
          await route.fulfill({
              status: 201,
              contentType: 'application/json',
              body: JSON.stringify({ success: true })
          });
      } else if (route.request().method() === 'GET') {
          const json = [{
              id: 'mock-session-drill-123',
              session_id: 'mock-session-123',
              drill_id: 'mock-drill-123',
              order_index: 0,
              coach_drills: {
                  id: 'mock-drill-123',
                  title: 'CEO Demo: Explosive Starts',
                  category: 'Fundamentals',
                  age_group: '16-20',
                  difficulty: 'advanced',
                  thumbnail_url: null,
                  created_at: new Date().toISOString(),
                  coach_id: 'coach-123',
                  description: 'Keep center of gravity low and explode through the toes.'
              }
          }];
          console.log('MOCKING GET /rest/v1/session_drills');
          await route.fulfill({
              contentType: 'application/json',
              body: JSON.stringify(json)
          });
      } else {
          await route.continue();
      }
  });

  // 3. Mock GET /rest/v1/coach_drill_steps
  await page.route('**/rest/v1/coach_drill_steps*', async route => {
      if (route.request().method() === 'GET') {
          const json = [{
              id: 'mock-step-123',
              drill_id: 'mock-drill-123',
              step_number: 1,
              title: 'Initial Explosion',
              instruction: 'Keep center of gravity low and explode through the toes. Focus on maintaining a 45-degree angle.'
          }];
          console.log('MOCKING GET /rest/v1/coach_drill_steps');
          await route.fulfill({
              contentType: 'application/json',
              body: JSON.stringify(json)
          });
      } else {
          await route.continue();
      }
  });

  // 4. Mock GET /api/my-schedule
  await page.route('**/api/my-schedule*', async route => {
      const json = [{
          id: 'mock-session-123',
          title: 'CEO Demo Training Class',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
          instructor: 'Coach Nick',
          category: 'PERFORMANCE',
          hasDrills: true,
          attendee: { first_name: 'Ghost Athlete' }
      }];
      console.log('MOCKING GET /api/my-schedule');
      await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(json)
      });
  });

  // 5. Mock GET /rest/v1/coach_drills
  await page.route('**/rest/v1/coach_drills*', async route => {
      if (route.request().method() === 'GET') {
          const url = route.request().url();
          if (url.includes('id=in.')) {
              const json = [{
                  id: 'mock-drill-123',
                  title: 'CEO Demo: Explosive Starts',
                  category: 'Fundamentals',
                  age_group: '16-20',
                  difficulty: 'advanced',
                  thumbnail_url: null,
                  created_at: new Date().toISOString(),
                  coach_id: 'coach-123',
                  description: 'Keep center of gravity low and explode through the toes.',
                  coach: {
                      first_name: 'Coach',
                      last_name: 'Nick',
                      avatar_url: null
                  }
              }];
              console.log('MOCKING GET /rest/v1/coach_drills (mock id match)');
              await route.fulfill({
                  contentType: 'application/json',
                  body: JSON.stringify(json)
              });
          } else {
              await route.continue();
          }
      } else {
          await route.continue();
      }
  });

  await page.goto('https://test-branch-east.vercel.app/');
  await page.waitForTimeout(3000);
  
  try {
      console.log('Selecting Coach Login...');
      await page.click('[data-testid="coach-portal-section"] button:has-text("LOGIN")');
      await page.waitForTimeout(2000);
      
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
          console.log('Logging in as coach...');
          await page.fill('input[type="email"]', 'nickmac1@gmail.com');
          await page.fill('input[type="password"]', 'password123');
          await page.click('button[type="submit"]');
          await page.waitForTimeout(8000); // Wait for dashboard to load fully
      }
  } catch (e) { console.log('Login step failed:', e); }
  
  console.log('--- COACH CREATE DRILL FLOW ---');
  // Assuming we are on the Coach Dashboard
  await page.waitForTimeout(3000);
  
  try {
      console.log('Switching to Drill Hub view in dashboard...');
      await page.click('button:has-text("Drill Hub")');
      await page.waitForTimeout(2000);
      
      console.log('Opening Create Drill Modal...');
      await page.click('text="+ Publish New"');
      await page.waitForTimeout(3000);
      
      console.log('Filling Drill Details...');
      await page.fill('input[placeholder="e.g. Power Slapshot Mastery"]', 'CEO Demo: Explosive Starts');
      await page.waitForTimeout(1000);
      await page.click('button:has-text("16-20")');
      await page.waitForTimeout(2000);
      
      console.log('Moving to Slide Builder...');
      await page.click('button:has-text("Build Slides")');
      await page.waitForTimeout(3000);
      
      console.log('Filling Slide Instructions...');
      await page.fill('input[placeholder="e.g. The Windup"]', 'V-Start Position');
      await page.waitForTimeout(1000);
      await page.fill('textarea', 'Keep center of gravity low and explode through the toes.');
      await page.waitForTimeout(2000);
      
      console.log('Publishing Drill...');
      await page.click('button:has-text("Publish Drill")');
      await page.waitForTimeout(6000); // Wait for upload/insert and modal close
  } catch(e) {
      console.log('Create drill flow failed:', e);
  }
  
  console.log('--- COACH DRILL HUB FLOW ---');
  await page.goto('https://test-branch-east.vercel.app/drill-hub');
  await page.waitForTimeout(5000); 
  
  console.log('Clicking the newly created drill...');
  try {
      await page.waitForSelector('h3:has-text("CEO Demo")', { state: 'visible', timeout: 10000 });
      await page.click('h3:has-text("CEO Demo")');
      console.log('Drill card clicked successfully.');
  } catch (e) {
      console.log('Drill card not found/clicked:', e.message);
  }
  await page.waitForTimeout(3000);

  console.log('Switching to Analysis Stream...');
  try {
      await page.waitForSelector('button:has-text("Analysis Stream")', { state: 'visible', timeout: 5000 });
      await page.click('button:has-text("Analysis Stream")');
  } catch(e) {
      console.log('Analysis Stream button not found:', e.message);
  }
  await page.waitForTimeout(3000);

  console.log('Switching back to Drill Briefing...');
  try {
      await page.waitForSelector('button:has-text("Drill Briefing")', { state: 'visible', timeout: 5000 });
      await page.click('button:has-text("Drill Briefing")');
  } catch (e) {
      console.log('Drill Briefing tab not found:', e.message);
  }
  await page.waitForTimeout(2000);
  
  console.log('--- EDIT DRILL FLOW ---');
  console.log('Clicking EDIT DRILL...');
  try {
      await page.waitForSelector('button:has-text("EDIT DRILL")', { state: 'visible', timeout: 5000 });
      await page.click('button:has-text("EDIT DRILL")');
  } catch (e) {
      console.log('Edit button not found:', e.message);
  }
  await page.waitForTimeout(2000);
  
  console.log('Modifying instruction...');
  try {
      await page.waitForSelector('textarea', { state: 'visible', timeout: 5000 });
      await page.fill('textarea', 'Keep center of gravity low and explode through the toes. Focus on maintaining a 45-degree angle.');
      await page.waitForTimeout(2000);
  } catch (e) {
      console.log('Textarea not found:', e.message);
  }
  
  console.log('Clicking SAVE DRILL...');
  try {
      await page.waitForSelector('button:has-text("SAVE DRILL")', { state: 'visible', timeout: 5000 });
      await page.click('button:has-text("SAVE DRILL")');
  } catch (e) {
      console.log('Save button not found:', e.message);
  }
  await page.waitForTimeout(3000);
  
  console.log('--- SCHEDULE DRILL FLOW ---');
  console.log('Clicking SCHEDULE DRILL...');
  try {
      await page.waitForSelector('button:has-text("SCHEDULE DRILL")', { state: 'visible', timeout: 5000 });
      await page.click('button:has-text("SCHEDULE DRILL")');
  } catch(e) {
      console.log('Schedule button not found:', e.message);
  }
  await page.waitForTimeout(3000);
  
  console.log('Selecting a mock session...');
  try {
      await page.waitForSelector('.fixed.inset-0 button.w-full', { state: 'visible', timeout: 5000 });
      const modalButtons = await page.$$('.fixed.inset-0 button.w-full'); 
      if (modalButtons.length > 0) {
          await modalButtons[0].click();
          await page.waitForTimeout(3000);
      }
  } catch (e) {
      console.log('Session button not found in modal:', e.message);
  }
  
  console.log('Closing modal...');
  try { await page.keyboard.press('Escape'); } catch(e) {}
  await page.waitForTimeout(1000);
  try { await page.keyboard.press('Escape'); } catch(e) {}
  await page.waitForTimeout(2000);
  
  console.log('--- ATHLETE SCHEDULE FLOW ---');
  
  console.log('Logging out Coach...');
  await page.evaluate(async () => {
      localStorage.clear();
      sessionStorage.clear();
      if (window.indexedDB && window.indexedDB.databases) {
          const dbs = await window.indexedDB.databases();
          for (const db of dbs) {
              window.indexedDB.deleteDatabase(db.name);
          }
      }
  });
  await context.clearCookies();
  
  console.log('Navigating to landing page...');
  await page.goto('https://test-branch-east.vercel.app/');
  await page.waitForTimeout(5000);
  
  console.log('Logging in as Athlete...');
  try {
      await page.click('[data-testid="athlete-portal-section"] button:has-text("LOGIN")');
      await page.waitForTimeout(2000);
      await page.fill('input[type="email"]', 'test-ghost-1775086280498@east.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("LOGIN"), button:has-text("SIGN IN")');
  } catch (e) {
      console.log('Error logging in as athlete:', e.message);
  }
  await page.waitForTimeout(6000);
  
  console.log('Navigating to Schedule tab...');
  try { await page.click('button:has-text("Schedule")', { timeout: 3000 }); } catch (e) { console.log('Schedule tab not found'); }
  await page.waitForTimeout(4000);
  
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(2000);
 
  console.log('Clicking VIEW PLAN to see the linked drills...');
  try { await page.click('button:has-text("VIEW PLAN")', { timeout: 4000 }); } catch (e) { console.log('VIEW PLAN button not found'); }
  await page.waitForTimeout(8000);     
  // Scroll inside the modal to ensure Plan Preview is visible
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(4000);

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();
  
  console.log(`Raw video saved to: ${videoPath}`);
  
  // Convert WebM to MP4 using ffmpeg
  const desktopMp4 = '/Users/nicholasmacaskill/Desktop/Drill_Hub_CEO_Full_Demo.mp4';
  console.log(`Converting to MP4...`);
  try {
      execSync(`ffmpeg -y -i "${videoPath}" -c:v libx264 -pix_fmt yuv420p "${desktopMp4}"`);
      console.log(`✅ Success! Full E2E MP4 saved to ${desktopMp4}`);
      execSync(`rm "${videoPath}"`);
  } catch(e) {
      console.error('ffmpeg conversion failed', e);
  }
})();
