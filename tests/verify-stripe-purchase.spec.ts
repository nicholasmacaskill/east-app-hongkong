import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Stripe Purchase Verification (Test Site)', () => {
  let testUserId: string;
  let testUserEmail: string;
  const testPassword = 'TestPassword123!';

  test.beforeAll(async () => {
      testUserEmail = `stripe-verify-${Date.now()}@east.com`;

      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
          email: testUserEmail,
          password: testPassword,
          email_confirm: true,
          user_metadata: { role: 'parent', first_name: 'Stripe', last_name: 'Verify' }
      });

      if (createError) throw createError;
      testUserId = userData.user.id;

      await supabase.from('profiles').upsert({
          id: testUserId,
          role: 'parent',
          first_name: 'Stripe',
          last_name: 'Verify',
          credits: 0
      });
      
      console.log(`[SETUP] Created test user: ${testUserEmail} (${testUserId})`);
  });

  test.afterAll(async () => {
      if (testUserId) {
          await supabase.auth.admin.deleteUser(testUserId);
          await supabase.from('profiles').delete().eq('id', testUserId);
          console.log(`[CLEANUP] Deleted test user: ${testUserId}`);
      }
  });

  test('Purchase 500 credits and verify UI update', async ({ page }) => {
      // 1. Login
      console.log(`[STEP 1] Logging in as ${testUserEmail}...`);
      await page.goto('/login');
      await page.fill('input[name="email"]', testUserEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button:has-text("LOGIN")');
      
      // Wait for dashboard/home
      await page.waitForTimeout(5000); 
      console.log(`[STEP 1] Current URL: ${page.url()}`);

      // 2. Capture initial balance
      // We expect 0 credits initially
      console.log(`[STEP 2] Verifying initial balance is 0...`);
      // The credit display might be in a specific component, let's look for text "0"
      // In this app, credits are often shown in a badge or sidebar
      await expect(page.getByText('0', { exact: true }).first()).toBeVisible({ timeout: 10000 });

      // 3. Trigger simulated webhook on the TEST SITE
      console.log(`[STEP 3] Triggering simulated Stripe webhook...`);
      const payload = {
          type: 'checkout.session.completed',
          data: {
              object: {
                  id: `verify_sess_${Date.now()}`,
                  mode: 'payment',
                  customer_details: { email: testUserEmail },
                  metadata: { target_user_id: testUserId, credit_amount: '500' }
              }
          }
      };

      const response = await page.evaluate(async (data) => {
          const res = await fetch('/api/webhooks/stripe?test=true', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'stripe-signature': 'test_signature' },
              body: JSON.stringify(data)
          });
          return { status: res.status, body: await res.text() };
      }, payload);

      console.log(`[STEP 3] Webhook response:`, response);
      expect(response.status).toBe(200);

      // 4. Verify balance update in UI
      console.log(`[STEP 4] Verifying credits updated to 500 in UI...`);
      // Refresh or wait for polling
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Look for "500" credits
      await expect(page.getByText('500', { exact: true }).first()).toBeVisible({ timeout: 10000 });
      console.log(`[STEP 4] ✅ Credits successfully updated to 500 in UI!`);

      // 5. Final DB check for robustness
      const { data: profile } = await supabase.from('profiles').select('credits').eq('id', testUserId).single();
      expect(profile?.credits).toBe(500);
      console.log(`[STEP 5] ✅ DB verification successful. Total credits: ${profile?.credits}`);
  });
});
