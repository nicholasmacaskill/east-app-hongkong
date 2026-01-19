import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Password Authentication Test', () => {
    let testUserId: string;
    let testUserEmail: string;
    const testPassword = 'TestPassword123!';

    test.afterAll(async () => {
        // Cleanup
        if (testUserId) {
            await supabase.auth.admin.deleteUser(testUserId);
            await supabase.from('profiles').delete().eq('id', testUserId);
        }
    });

    test('Admin-set password works for login', async ({ page }) => {
        // 1. Create user via Supabase Admin API (simulates admin panel)
        testUserEmail = `test-pwd-${Date.now()}@east.com`;

        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email: testUserEmail,
            password: 'TempPassword123!', // Temporary password admin sets
            email_confirm: true,
            user_metadata: {
                role: 'parent',
                first_name: 'Password',
                last_name: 'Test'
            }
        });

        if (createError) throw createError;
        testUserId = userData.user.id;

        // 2. Create profile
        await supabase.from('profiles').upsert({
            id: testUserId,
            role: 'parent',
            first_name: 'Password',
            last_name: 'Test'
        });

        console.log(`[TEST] Created user: ${testUserId}, email: ${testUserEmail}`);

        // 3. Test login with admin-set password
        await page.goto('/login');
        await page.waitForTimeout(1000);

        await page.fill('input[name="email"]', testUserEmail);
        await page.fill('input[name="password"]', 'TempPassword123!');
        await page.click('button:has-text("LOGIN")');

        // 4. Verify successful login
        await page.waitForTimeout(3000);

        // Check if we're on the home page (not stuck on login)
        const currentUrl = page.url();
        console.log(`[TEST] Current URL after login: ${currentUrl}`);

        expect(currentUrl).not.toContain('/login');

        console.log('[TEST] ✅ Login with admin-set password successful!');

        // 5. Test password update via admin API
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            testUserId,
            { password: testPassword }
        );
        if (updateError) throw updateError;

        console.log('[TEST] Password updated to:', testPassword);

        // 6. Log out
        await page.evaluate(() => localStorage.clear());
        await page.context().clearCookies();

        // 7. Test login with updated password
        await page.goto('/login');
        await page.waitForTimeout(1000);

        await page.fill('input[name="email"]', testUserEmail);
        await page.fill('input[name="password"]', testPassword);
        await page.click('button:has-text("LOGIN")');

        await page.waitForTimeout(3000);

        const finalUrl = page.url();
        console.log(`[TEST] Final URL after password update login: ${finalUrl}`);

        expect(finalUrl).not.toContain('/login');

        console.log('[TEST] ✅ Login with updated password successful!');
        console.log('[TEST] ✅ PASSWORD FLOW VERIFIED - Admin-set and updated passwords both work!');
    });
});
