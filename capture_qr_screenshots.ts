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
  // Grant camera permissions to prevent permission prompts blocking the UI
  const context = await browser.newContext({
    permissions: ['camera']
  });
  const page = await context.newPage();

  const testUserEmail = `qr-screen-test-${Date.now()}@east.com`;
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

    // 2. Add profile
    await supabase.from('profiles').upsert({
        id: testUserId,
        role: 'player',
        first_name: 'John',
        last_name: 'Doe',
        credits: 500,
        bio: 'Avid Gym Goer'
    });

    // 3. Log in
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', testUserEmail);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to home
    await page.waitForURL('http://localhost:3001/');
    
    // 4. Capture QR Wallet Screen
    await page.goto('http://localhost:3001/?tab=qr');
    await page.waitForTimeout(3000); 
    await page.screenshot({ path: '/Users/nicholasmacaskill/.gemini/antigravity/brain/93d68147-bcb6-4a55-952b-38d89dfb9aab/artifacts/qr_wallet.png', fullPage: true });
    console.log("QR Wallet screenshot taken successfully.");

    // 5. Capture Check-In/Scanner Screen
    await page.goto('http://localhost:3001/check-in');
    await page.waitForTimeout(3000); 
    await page.screenshot({ path: '/Users/nicholasmacaskill/.gemini/antigravity/brain/93d68147-bcb6-4a55-952b-38d89dfb9aab/artifacts/qr_scanner.png', fullPage: true });
    console.log("QR Scanner screenshot taken successfully.");

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
