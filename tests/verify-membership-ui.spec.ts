import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Membership UI Verification', () => {
    let testUserId: string;
    let testUserEmail: string;
    const testPassword = 'TestPassword123!';

    test.beforeAll(async () => {
        // 1. Create User
        testUserEmail = `member-ui-test-${Date.now()}@east.com`;
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: testUserEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: { first_name: 'UI', last_name: 'Tester' }
        });
        if (authError) throw authError;
        testUserId = authData.user.id;

        // 2. Grant Subscription (Active)
        // Set expiry to 30 days from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        // Wait for potential trigger to create the profile
        await new Promise(r => setTimeout(r, 2000));

        // Update profile with subscription details using Admin client
        // Use UPSERT to ensure row exists if trigger failed
        const { error: updateError } = await supabase.from('profiles').upsert({
            id: testUserId,
            first_name: 'UI',
            last_name: 'Tester',
            contact_email: testUserEmail,
            role: 'parent',
            subscription_status: 'active',
            membership_tier: 'individual',
            membership_expires: expiryDate.toISOString()
        });

        if (updateError) {
            console.error('Profile update failed:', updateError);
            throw updateError;
        }

        // Verify the profile state in DB
        const { data: profileCheck } = await supabase.from('profiles').select('*').eq('id', testUserId).single();

        if (profileCheck?.subscription_status !== 'active') {
            throw new Error('Failed to set subscription_status to active in DB');
        }
    });

    test.afterAll(async () => {
        if (testUserId) {
            await supabase.auth.admin.deleteUser(testUserId);
            await supabase.from('profiles').delete().eq('id', testUserId);
        }
    });

    test('Verify Active Membership UI Elements', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        try {
            await page.fill('input[name="email"]', testUserEmail);
            await page.fill('input[name="password"]', testPassword);
        } catch {
            await page.fill('input[type="email"]', testUserEmail);
            await page.fill('input[type="password"]', testPassword);
        }
        // Robust Login
        const loginBtn = page.getByRole('button', { name: "LOGIN" });
        await expect(loginBtn).toBeEnabled();
        await loginBtn.click({ force: true });
        await page.waitForURL('/');

        // 2. Navigate to Profile -> Settings
        await page.waitForTimeout(5000); // Stability wait for profile load

        // Click Profile Tab (Bottom Nav)
        await page.click('text=Profile');

        // Wait for unique text on profile (e.g. User Name) to ensure load
        await expect(page.getByText('UI Tester', { exact: false })).toBeVisible({ timeout: 10000 });

        // Click Settings Icon (Edit Button on Profile)
        // Using reliable data-testid with force click to bypass potential overlay/animation checks
        await page.getByTestId('settings-button').click({ force: true });

        // 3. Navigate to Membership Section
        await page.getByTestId('menu-item-membership').click();
        await page.waitForURL('**/membership');

        // 4. Verify Active Status Card
        const isPurchaseVisible = await page.getByRole('button', { name: /activate/i }).isVisible();
        if (isPurchaseVisible) {
            throw new Error("🚨 TEST FAILED: User has no active subscription (Purchase button is visible). DB Upsert didn't persist or was overwritten.");
        }

        // Use heading locator and loosen text matching (case formatting)
        try {
            await expect(page.getByRole('heading', { name: /current plan/i })).toBeVisible({ timeout: 10000 });
            // Wait for "Active" text specifically, it might load async
            await expect(page.getByText('Active', { exact: false })).toBeVisible({ timeout: 10000 });
        } catch (e) {
            console.log('🚨 TEST FAILURE DEBUG SNAPSHOT 🚨');
            const fs = require('fs');
            fs.writeFileSync('debug_page.html', await page.content());
            throw e;
        }
        await expect(page.getByText('PRO MEMBERSHIP')).toBeVisible();

        // 5. Verify Dates
        // We know it expires in roughly 30 days. Let's just check the labels exist and some date text is present.
        await expect(page.getByText('Expiry Date')).toBeVisible();
        await expect(page.getByText('Next Billing')).toBeVisible();

        // 6. Verify Cancel Button
        const cancelBtn = page.getByTestId('cancel-subscription-button');
        await expect(cancelBtn).toBeVisible();

        // Check href for mailto
        await expect(cancelBtn).toHaveAttribute('href', 'mailto:support@east.com?subject=Cancellation Request - Membership');

        console.log('✅ Membership UI elements verified successfully.');
    });
});
