import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe.configure({ mode: 'serial' });

test.describe('Admin System Control', () => {
    let adminId: string;
    let playerId: string;
    const uniqueSuffix = Date.now();
    const adminEmail = `admin-sys-${uniqueSuffix}@east.com`;
    const playerFirstName = `Target-${uniqueSuffix}`;
    const playerEmail = `player-${uniqueSuffix}@east.com`;
    const adminPassword = 'TestAdminPassword123!';

    test.beforeAll(async () => {
        // 1. Create Admin User
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'Sys', last_name: 'Admin' }
        });
        if (adminError) throw adminError;
        adminId = adminData.user.id;
        await supabase.from('profiles').upsert({ id: adminId, role: 'sys-admin', first_name: 'Sys', last_name: 'Admin' });

        // 2. Create Target Player
        const { data: playerData, error: playerError } = await supabase.auth.admin.createUser({
            email: playerEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: playerFirstName, last_name: 'Player' }
        });
        if (playerError) throw playerError;
        playerId = playerData.user.id;
        await supabase.from('profiles').upsert({ id: playerId, role: 'player', first_name: playerFirstName, last_name: 'Player' });
    });

    test.afterAll(async () => {
        if (adminId) await supabase.auth.admin.deleteUser(adminId);
        try {
            if (playerId) await supabase.auth.admin.deleteUser(playerId);
        } catch (e) { }
    });

    test('Admin Dashboard & Directory Control', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*sys-admin/, { timeout: 15000 });
        await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });

        // 2. People Directory & Credit Adjustment
        await page.click('text=People Directory');
        await expect(page.locator('h1:has-text("People Directory")')).toBeVisible({ timeout: 10000 });
        await page.fill('input[placeholder*="Search"]', playerFirstName);

        const playerRow = page.locator('.group').filter({ hasText: playerFirstName }).first();
        await expect(playerRow).toBeVisible({ timeout: 10000 });

        await playerRow.hover();
        const plusBtn = playerRow.locator('button').filter({ hasText: '+' }).first();
        await plusBtn.click({ force: true });

        // Verify Credit Update in UI
        await expect(playerRow.locator('text=10')).toBeVisible({ timeout: 15000 });
        console.log('[TEST] Manual credit adjustment verified');
    });

    test('News Publishing Flow', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*sys-admin/, { timeout: 15000 });

        await page.goto('/sys-admin/news');
        await expect(page.locator('h1:has-text("News Management")')).toBeVisible({ timeout: 10000 });

        const storyTitle = `Breaking News ${Date.now()}`;
        await page.click('button:has-text("Add Announcement")');
        await page.fill('input[placeholder*="headline"]', storyTitle);
        await page.fill('textarea[placeholder*="story"]', 'EAST is expanding to new locations!');
        await page.check('input#published'); // Publish immediately
        await page.click('button:has-text("Save Story")');
        await page.waitForTimeout(2000); // Wait for save to complete

        // Verify it appears in admin list
        await expect(page.locator(`text=${storyTitle}`)).toBeVisible({ timeout: 10000 });
        console.log('[TEST] News publishing verified');
    });

    test('System Offboarding (User Deletion)', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*sys-admin/, { timeout: 15000 });

        await page.goto('/sys-admin/directory');
        await page.fill('input[placeholder*="Search"]', playerFirstName);

        const offboardRow = page.locator('.group').filter({ hasText: playerFirstName }).first();
        page.once('dialog', async dialog => { await dialog.accept(); });
        await offboardRow.locator('button:has(svg.lucide-trash2)').click();
        await expect(page.locator(`text=${playerFirstName}`)).not.toBeVisible({ timeout: 15000 });

        // Verify in Database
        const { data } = await supabase.from('profiles').select('*').eq('id', playerId);
        expect(data?.length).toBe(0);
        console.log('[TEST] User offboarding verified');
    });
});
