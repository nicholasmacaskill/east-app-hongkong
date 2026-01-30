import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Setup Supabase for user creation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Sales Flow Redirects', () => {
    let testUserEmail: string;
    const testPassword = 'RedirectUser123!';

    test.beforeAll(async () => {
        const timestamp = Date.now();
        testUserEmail = `redirect-test-${timestamp}@east.com`;

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: testUserEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: { first_name: 'Redirect', last_name: 'Tester' }
        });

        if (authError) throw authError;

        await supabase.from('profiles').upsert({
            id: authUser.user.id,
            first_name: 'Redirect',
            last_name: 'Tester',
            contact_email: testUserEmail,
            role: 'player'
        });
    });

    test.afterAll(async () => {
        // Cleanup
        if (testUserEmail) {
            const { data: user } = await supabase.from('profiles').select('id').eq('contact_email', testUserEmail).single();
            if (user) {
                await supabase.auth.admin.deleteUser(user.id);
                await supabase.from('profiles').delete().eq('id', user.id);
            }
        }
    });

    test('Purchase Success Redirect -> Home Screen Toast Verification', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', testUserEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL('/');

        // 2. Visit Home Success URL manually (simulating the Stripe redirect)
        await page.goto('/?success=true');

        // 3. Verify Toast appears
        // The home page trigger "Payment Received" logic
        const toast = page.getByText('Payment Received');
        await expect(toast).toBeVisible({ timeout: 10000 });

        // 4. Verify URL cleanup 
        await page.waitForTimeout(1000);
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('success=true');

        // Should still be on home
        const path = new URL(currentUrl).pathname;
        expect(path).toBe('/');

        console.log('✅ Sales Redirect Logic Verified');
    });
});
