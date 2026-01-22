import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('Real-Time Account Unlock Logic', () => {
    let testUser: any;

    test.beforeAll(async () => {
        const email = `test-lock-${Date.now()}@east.com`;
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { role: 'player' }
        });

        if (authError) throw authError;
        testUser = authUser.user;

        // Force 'locked' state
        await supabaseAdmin
            .from('profiles')
            .update({
                account_status: 'locked',
                subscription_status: 'inactive',
                role: 'player'
            })
            .eq('id', testUser.id);
    });

    test.afterAll(async () => {
        if (testUser) {
            await supabaseAdmin.auth.admin.deleteUser(testUser.id);
        }
    });

    test('LockedOverlay should disappear instantly when account is unlocked via DB', async ({ page }) => {
        // Capture console logs
        page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));

        // 1. Login
        await page.goto('/login');
        await page.fill('input[placeholder="Enter your email"]', testUser.email);
        await page.fill('input[placeholder="Enter your password"]', 'Password123!');
        await page.click('button[type="submit"], button:has-text("Sign In")');

        // 2. Verify LockedOverlay is visible
        await page.waitForURL('/');
        await expect(page.locator('[data-testid="locked-overlay"]')).toBeVisible();

        console.log('👀 LockedOverlay is visible as expected.');

        // 3. Simulate Admin Unlock
        console.log('🔓 Unlocking account via DB...');
        await supabaseAdmin
            .from('profiles')
            .update({ account_status: 'active' })
            .eq('id', testUser.id);

        // 4. Wait for the Real-time Event to hit the browser
        console.log('⏳ Waiting for real-time payload...');
        await page.waitForFunction(() => {
            const update = (window as any).lastProfileUpdate;
            return update && update.account_status === 'active';
        }, { timeout: 15000 });

        const receivedStatus = await page.evaluate(() => (window as any).lastProfileUpdate.account_status);
        console.log(`📥 Browser received update: account_status = ${receivedStatus}`);

        // 5. Verify Overlay disappears
        await expect(page.locator('[data-testid="locked-overlay"]')).not.toBeVisible({ timeout: 10000 });

        console.log('✅ Real-time unlock verified successfully!');
    });
});
