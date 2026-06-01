import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testUserEmail = `profile-test-${Date.now()}@east.com`;
  let testUserId = '';

  try {
    // 1. Create a test user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: testUserEmail,
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: { role: 'player', first_name: 'John', last_name: 'Doe' }
    });

    if (createError) throw createError;
    testUserId = userData.user.id;

    // 2. Add profile and some check-ins
    await supabase.from('profiles').upsert({
        id: testUserId,
        role: 'player',
        first_name: 'John',
        last_name: 'Doe',
        credits: 500,
        bio: 'Avid Gym Goer'
    });
    
    await supabase.from('check_ins').insert([
        { user_id: testUserId, location_id: 'Location 1' },
        { user_id: testUserId, location_id: 'Location 2' },
        { user_id: testUserId, location_id: 'Location 3' }
    ]);

    // 3. Log in
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', testUserEmail);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to home
    await page.waitForURL('http://localhost:3001/');
    
    // 4. Go to profile tab
    await page.goto('http://localhost:3001/?tab=profile');
    
    // Wait for profile stats to load
    await page.waitForTimeout(4000); 

    // Take screenshot
    await page.screenshot({ path: '/Users/nicholasmacaskill/.gemini/antigravity/brain/93d68147-bcb6-4a55-952b-38d89dfb9aab/artifacts/profile_ui.png', fullPage: true });
    console.log("Profile screenshot taken successfully.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    // Cleanup
    if (testUserId) {
        await supabase.auth.admin.deleteUser(testUserId);
    }
    await browser.close();
  }
})();
