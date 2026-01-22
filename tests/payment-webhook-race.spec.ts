import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('Payment Webhook Race Condition Fix', () => {
    let testUser: any;

    test.beforeAll(async () => {
        const email = `test-payment-${Date.now()}@east.com`;
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { role: 'player' }
        });

        if (authError) throw authError;
        testUser = authUser.user;

        // Ensure baseline credits
        await supabaseAdmin
            .from('profiles')
            .update({ credits: 100, account_status: 'active' })
            .eq('id', testUser.id);
    });

    test.afterAll(async () => {
        if (testUser) {
            await supabaseAdmin.auth.admin.deleteUser(testUser.id);
        }
    });

    test('Should show processing state and update credits in real-time', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[placeholder="Enter your email"]', testUser.email);
        await page.fill('input[placeholder="Enter your password"]', 'Password123!');
        await page.click('button[type="submit"], button:has-text("Sign In")');
        await page.waitForURL('/');

        // 2. Simulate Stripe Success Redirect
        console.log('🔄 Simulating Stripe success redirect...');
        await page.goto('/?success=true');

        // 3. Verify "Processing" toast appears
        await expect(page.locator('text=Payment Received. Finalizing credits...')).toBeVisible();
        console.log('👀 "Processing" toast is visible.');

        // 4. Verify baseline credits in UI
        const creditLocator = page.locator('button:has-text("CREDITS") span.text-white');
        await expect(creditLocator).toHaveText('100');

        // 5. Simulate Webhook DB Update
        console.log('💰 Simulating Webhook DB update (+50 credits)...');
        await supabaseAdmin
            .from('profiles')
            .update({ credits: 150 })
            .eq('id', testUser.id);

        // 6. Verify processing toast disappears and success toast appears
        await expect(page.locator('text=Payment Received. Finalizing credits...')).not.toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Credits Authenticated! You\'re ready to book.')).toBeVisible();
        console.log('✅ Toasts transitioned correctly.');

        // 7. Verify credits updated in UI
        await expect(creditLocator).toHaveText('150');
        console.log('✅ UI credits updated in real-time.');
    });
});
