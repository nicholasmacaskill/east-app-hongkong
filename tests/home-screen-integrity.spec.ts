
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Home Screen Integrity & Auth Redirection (Hardened)', () => {
    let adminId: string;
    let adminEmail: string;
    let playerId: string;
    let playerEmail: string;
    const testPassword = 'TestAuthFix123!';

    test.beforeAll(async () => {
        const unique = Math.random().toString(36).substring(7);
        adminEmail = `auth-fix-admin-${unique}@east.com`;
        playerEmail = `auth-fix-player-${unique}@east.com`;

        // 1. Create Test Admin
        const { data: adminData } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'Auth', last_name: 'Fix' }
        });
        adminId = adminData.user!.id;
        await supabase.from('profiles').upsert({ id: adminId, role: 'sys-admin', first_name: 'Auth', last_name: 'Fix' });

        // 2. Create Test Player
        const { data: playerData } = await supabase.auth.admin.createUser({
            email: playerEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'Player', last_name: 'Fix' }
        });
        playerId = playerData.user!.id;
        await supabase.from('profiles').upsert({ id: playerId, role: 'player', first_name: 'Player', last_name: 'Fix', account_status: 'active', subscription_status: 'active' });
    });

    test.afterAll(async () => {
        if (adminId) await supabase.auth.admin.deleteUser(adminId);
        if (playerId) await supabase.auth.admin.deleteUser(playerId);
    });

    test('Admin should be redirected to /sys-admin instantly after login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');

        await page.waitForURL(/.*sys-admin/, { timeout: 20000 });
        await expect(page).toHaveURL(/.*sys-admin/);
        await expect(page.locator('h1').filter({ hasText: /Dashboard/i }).first()).toBeVisible({ timeout: 15000 });
    });

    test('Home Screen should display 3 Core Service Tiles (Facility, Class, Private)', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(4000); // Wait for landing animation

        // Select Athlete Portal
        const athletePortal = page.getByTestId('athlete-portal-section');
        await athletePortal.getByRole('button', { name: 'LOGIN' }).click();

        // Perform Login
        await page.fill('input[placeholder="Enter your email"]', playerEmail);
        await page.fill('input[placeholder="Enter your password"]', testPassword);
        await page.click('button[type="submit"], button:has-text("LOGIN")');

        // Wait for Home Screen (Look for CREDITS or HOME indication)
        await page.waitForSelector('text=CREDITS', { timeout: 30000 });

        // Verify the 3 Section Headers
        await expect(page.locator('h2').filter({ hasText: /^Facilities$/i }).first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator('h2').filter({ hasText: /^Classes$/i }).first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator('h2').filter({ hasText: /^Private Lessons$/i }).first()).toBeVisible({ timeout: 15000 });
    });
});
