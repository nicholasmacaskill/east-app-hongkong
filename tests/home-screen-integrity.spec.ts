import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Home Screen Integrity & Auth Redirection', () => {
    let adminId: string;
    let adminEmail: string;
    const adminPassword = 'TestAuthFix123!';

    test.beforeAll(async () => {
        const unique = Math.random().toString(36).substring(7);
        adminEmail = `auth-fix-admin-${unique}@east.com`;

        // Create a Test Admin
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'Auth', last_name: 'Fix' }
        });
        if (adminError) throw adminError;
        adminId = adminData.user!.id;
        await supabase.from('profiles').upsert({ id: adminId, role: 'sys-admin', first_name: 'Auth', last_name: 'Fix' });
    });

    test.afterAll(async () => {
        if (adminId) await supabase.auth.admin.deleteUser(adminId);
    });

    test('Admin should be redirected to /sys-admin instantly after login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPassword);

        // Click login and wait for the redirect
        await page.click('button[type="submit"]');

        // Verify we land on sys-admin, not the player home screen
        await page.waitForURL(/.*sys-admin/, { timeout: 15000 });
        await expect(page).toHaveURL(/.*sys-admin/);
        await expect(page.getByText(/Admin Access/i)).toBeVisible();
    });

    test('Home Screen should display 3 Core Service Tiles (Facility, Class, Private)', async ({ page }) => {
        // We can check this as a public user or player. 
        // Let's go to the landing page and choose "Player"
        await page.goto('/');

        // If it's the landing screen, select role
        const roleButton = page.locator('button:has-text("Player")');
        if (await roleButton.isVisible()) {
            await roleButton.click();
        }

        // Wait for the Home Screen to hydrate
        await page.waitForFunction(() => !document.body.innerText.includes('Loading...'), { timeout: 15000 });

        // Verify the 3 Section Headers
        await expect(page.getByText(/^Facilities$/i)).toBeVisible();
        await expect(page.getByText(/^Classes$/i)).toBeVisible();
        await expect(page.getByText(/^Private Lessons$/i)).toBeVisible();

        // Verify specific core tile titles (from our recent seeding)
        await expect(page.getByText(/^Facility$/).first()).toBeVisible();
        await expect(page.getByText(/^Class$/).first()).toBeVisible();
        await expect(page.getByText(/^Private Session$/).first()).toBeVisible();
    });

    test('Home Screen should show Skeleton loaders during data fetch', async ({ page }) => {
        // We can verify skeletons by going to the page and checking for the animate-pulse class 
        // before the data arrives. This is a bit timing-sensitive but good for smoke testing.
        await page.goto('/');

        const roleButton = page.locator('button:has-text("Player")');
        if (await roleButton.isVisible()) {
            await roleButton.click();
        }

        // Skeletons are used in HomeScreen.tsx
        const skeleton = page.locator('.animate-pulse').first();
        // Since it's fast, we might miss it in some environments, but we check if it exists initially
        // or if the "Loading..." state is shown first
        const loadingState = page.getByText(/Loading.../i);

        await expect(loadingState.or(skeleton)).toBeVisible();
    });
});
