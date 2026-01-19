import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Membership Lifecycle Management', () => {
    let testUserEmail: string;
    const testPassword = 'MembershipUser123!';

    test.beforeEach(async () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        testUserEmail = `membership-test-${timestamp}-${random}@east.com`;

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: testUserEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: { first_name: 'Membership', last_name: `Tester-${timestamp}` }
        });

        if (authError) throw authError;

        await supabase.from('profiles').upsert({
            id: authUser.user.id,
            first_name: 'Membership',
            last_name: `Tester-${timestamp}`,
            contact_email: testUserEmail,
            role: 'player'
        });
    });

    test.afterEach(async () => {
        // Cleanup
        const { data: user } = await supabase.from('profiles').select('id').eq('contact_email', testUserEmail).single();
        if (user) {
            await supabase.auth.admin.deleteUser(user.id);
            await supabase.from('profiles').delete().eq('id', user.id);
        }
    });

    test('Admin can manually override membership dates', async ({ page }) => {
        // 1. LOGIN AS ADMIN
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@east.com');
        await page.fill('input[type="password"]', 'EastAdmin2026!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/sys-admin');

        // 2. NAVIGATE TO DIRECTORY
        await page.goto('/sys-admin/directory');

        // 3. SEARCH FOR TEST USER
        await page.fill('input[placeholder*="Search"]', testUserEmail);

        // Wait for list to filter and find the USER CARD by NAME (since email is hidden)
        // Extract timestamp from email to reconstruct name
        const timestamp = testUserEmail.split('-')[2].split('@')[0];
        const uniqueName = `Membership Tester-${timestamp}`;

        await expect(page.locator(`text=${uniqueName}`)).toBeVisible();

        // 4. OPEN EDIT MODAL
        const userCard = page.locator(`div.rounded-2xl:has-text("${uniqueName}")`).first();
        // Click the edit button within that card.
        await userCard.locator('button').first().click({ force: true });

        // 5. UPDATE MEMBERSHIP DATES
        await expect(page.locator('h2:has-text("Edit Profile")')).toBeVisible();

        // Fill dates
        const startDate = '2025-01-01';
        const expiryDate = '2026-01-01';

        // Selectors based on labels
        await page.locator('div:has(> label:has-text("Member Since")) >> input').fill(startDate);
        await page.locator('div:has(> label:has-text("Expires On")) >> input').fill(expiryDate);

        // 6. SAVE
        await page.click('button:has-text("Save Changes")');

        // Allow toast/alert to close or for modal to disappear
        await expect(page.locator('h2:has-text("Edit Profile")')).not.toBeVisible();

        // 7. VERIFY CHANGES
        // Re-open the modal to check if values persisted
        await userCard.locator('button').first().click({ force: true });
        await expect(page.locator('h2:has-text("Edit Profile")')).toBeVisible();

        await expect(page.locator('div:has(> label:has-text("Member Since")) >> input')).toHaveValue(startDate);
        await expect(page.locator('div:has(> label:has-text("Expires On")) >> input')).toHaveValue(expiryDate);
    });

    test('Admin can use Quick Actions to Reactivate and Cancel membership', async ({ page }) => {
        // 1. LOGIN & NAVIGATE
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@east.com');
        await page.fill('input[type="password"]', 'EastAdmin2026!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/sys-admin');
        await page.goto('/sys-admin/directory');

        // 2. SEARCH USER
        await page.fill('input[placeholder*="Search"]', testUserEmail);
        const timestamp = testUserEmail.split('-')[2].split('@')[0];
        const uniqueName = `Membership Tester-${timestamp}`;
        await expect(page.locator(`text=${uniqueName}`)).toBeVisible();

        // 3. OPEN EDIT MODAL
        const userCard = page.locator(`div.rounded-2xl:has-text("${uniqueName}")`).first();
        await userCard.locator('button').first().click({ force: true });
        await expect(page.locator('h2:has-text("Edit Profile")')).toBeVisible();

        // 4. TEST REACTIVATE
        const today = new Date();
        const nextYear = new Date(new Date().setFullYear(today.getFullYear() + 1));
        const nextYearStr = nextYear.toISOString().split('T')[0];

        await page.click('button:has-text("Reactivate (+1 Year)")');
        await expect(page.locator('div:has(> label:has-text("Expires On")) >> input')).toHaveValue(nextYearStr);

        // 5. TEST CANCEL
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        await page.click('button:has-text("Cancel Immediately")');
        await expect(page.locator('div:has(> label:has-text("Expires On")) >> input')).toHaveValue(yesterdayStr);

        // 6. SAVE & VERIFY PERSISTENCE
        await page.click('button:has-text("Save Changes")');
        await expect(page.locator('h2:has-text("Edit Profile")')).not.toBeVisible();

        await userCard.locator('button').first().click({ force: true });
        await expect(page.locator('h2:has-text("Edit Profile")')).toBeVisible();
        await expect(page.locator('div:has(> label:has-text("Expires On")) >> input')).toHaveValue(yesterdayStr);
    });

    test('Admin can trigger Password Reset Email', async ({ page }) => {
        // 1. LOGIN & NAVIGATE
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@east.com');
        await page.fill('input[type="password"]', 'EastAdmin2026!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/sys-admin');
        await page.goto('/sys-admin/directory');

        // 2. SEARCH USER
        await page.fill('input[placeholder*="Search"]', testUserEmail);
        const timestamp = testUserEmail.split('-')[2];
        const uniqueName = `Membership Tester-${timestamp}`;
        await expect(page.locator(`text=${uniqueName}`)).toBeVisible();

        // 3. OPEN EDIT MODAL
        const userCard = page.locator(`div.rounded-2xl:has-text("${uniqueName}")`).first();
        await userCard.locator('button').first().click({ force: true });
        await expect(page.locator('h2:has-text("Edit Profile")')).toBeVisible();

        // 4. CLICK RESET PASSWORD BUTTON & HANDLE ALERTS
        // We expect two dialogs:
        // 1. Confirm: "Send password reset email to..."
        // 2. Alert: "Reset email sent!" (or error)
        page.on('dialog', async dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            if (dialog.message().includes('Send password reset email')) {
                await dialog.accept();
            } else {
                await dialog.dismiss();
            }
        });

        // Spy on API request
        const requestPromise = page.waitForRequest(request =>
            request.url().includes('/api/admin/send-reset-email') && request.method() === 'POST'
        );

        await page.click('button:has-text("Send Password Reset Email")');

        const request = await requestPromise;
        expect(request.postDataJSON()).toEqual({ email: testUserEmail });

        // Wait for potential network response
        const response = await page.waitForResponse(resp =>
            resp.url().includes('/api/admin/send-reset-email') && resp.status() === 200
        );
        expect(await response.json()).toEqual({
            success: true,
            message: 'Password reset email sent via Resend'
        });
    });
});
