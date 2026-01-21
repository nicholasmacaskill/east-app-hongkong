import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('QA Verification - Fixed Bugs', () => {
    let adminId: string;
    let playerId: string;
    let adminEmail: string;
    let playerEmail: string;
    const adminPassword = 'TestQAAdmin123!';
    const playerPassword = 'TestQAPlayer123!';

    test.beforeAll(async () => {
        const unique = Math.random().toString(36).substring(7);
        adminEmail = `qa-admin-${unique}@east.com`;
        playerEmail = `qa-player-${unique}@east.com`;

        // 1. Create Admin
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'QA', last_name: 'Admin' }
        });
        if (adminError) throw adminError;
        adminId = adminData.user!.id;
        await supabase.from('profiles').upsert({ id: adminId, role: 'sys-admin', first_name: 'QA', last_name: 'Admin' });

        // 2. Create Player
        const { data: playerData, error: playerError } = await supabase.auth.admin.createUser({
            email: playerEmail,
            password: playerPassword,
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'QA', last_name: 'Player' }
        });
        if (playerError) throw playerError;
        playerId = playerData.user!.id;
        await supabase.from('profiles').upsert({ id: playerId, role: 'player', first_name: 'QA', last_name: 'Player', credits: 100 });
    });

    test.afterAll(async () => {
        if (adminId) await supabase.auth.admin.deleteUser(adminId);
        if (playerId) await supabase.auth.admin.deleteUser(playerId);
    });

    const isHydrated = async (page) => {
        await page.waitForFunction(() => !document.body.innerText.includes('Loading...'), { timeout: 30000 });
        await page.waitForLoadState('networkidle');
        // Wait for a common UI element to be present
        await page.waitForTimeout(1000);
    };

    // 1. Membership Success Experience
    test('1. Membership Success Experience Redirect', async ({ page }) => {
        await page.goto('/membership/success');
        await expect(page.getByText(/Welcome to the Team/i)).toBeVisible({ timeout: 15000 });
    });

    // 2. Credit Top-up Feedback
    test('2. Credit Top-up Feedback (Toast)', async ({ page }) => {
        await page.goto('/?success=true');
        await isHydrated(page);
        await expect(page.getByText(/Transaction Successful/i)).toBeVisible({ timeout: 15000 });
    });

    // 3. Admin Directory Usability
    test('3. Admin Directory Tabs & Role Colors', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*sys-admin/);

        await page.goto('/sys-admin/directory');
        await isHydrated(page);

        await page.getByRole('button', { name: /unassigned/i }).click();
        await expect(page.getByText(/unassigned/i).first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator('.text-amber-500').first()).toBeVisible({ timeout: 15000 });
    });

    // 4. Admin Services Layout (Scrollable)
    test('4. Admin Services Modal Scrolling', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*sys-admin/);

        await page.goto('/sys-admin/services');
        await isHydrated(page);

        await page.getByRole('button', { name: /add service/i }).click();
        const modal = page.locator('.max-h-\\[90vh\\]');
        await expect(modal).toBeVisible({ timeout: 15000 });
        await expect(modal).toHaveClass(/overflow-y-auto/);
    });

    // 5. Coach Assignment Logic
    test('5. Coach Assignment Logic Rendering', async ({ page }) => {
        await page.goto('/');
        await isHydrated(page);
        await expect(page.getByText(/our coaches/i)).toBeVisible({ timeout: 15000 });
    });

    // 6. Account Unlock Logic
    test('6. Account Unlock Logic (Manual Active)', async ({ page }) => {
        await supabase.from('profiles').update({
            subscription_status: 'inactive',
            account_status: 'active'
        }).eq('id', playerId);

        await page.goto('/login');
        await page.fill('input[type="email"]', playerEmail);
        await page.fill('input[type="password"]', playerPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
        await isHydrated(page);

        await expect(page.getByText(/account locked/i)).not.toBeVisible();
    });

    // 7. Coach Grid Slot Defaults (Admin Schedule)
    test('7. Coach Grid Slot Defaults (Admin Schedule)', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*sys-admin/);

        await page.goto('/sys-admin/schedule');
        await isHydrated(page);

        const cell = page.locator('.bg-black\\/20').first();
        await cell.waitFor({ state: 'visible', timeout: 20000 });
        await cell.click({ force: true });

        await expect(page.getByText(/add session/i)).toBeVisible({ timeout: 20000 });
    });

    // 8. Admin Calendar Visibility
    test('8. Admin Calendar Visibility', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*sys-admin/);

        await page.goto('/sys-admin/schedule');
        await isHydrated(page);

        await expect(page.getByText(/master schedule/i)).toBeVisible({ timeout: 15000 });
    });

    // 9. Orphan Session Sync
    test('9. Orphan Session Sync (Private Coaching Tile)', async ({ page }) => {
        const { data: session } = await supabase.from('sessions').insert({
            title: 'Test Orphan',
            category: 'PRIVATE',
            start_time: new Date(Date.now() + 86400000).toISOString(),
            end_time: new Date(Date.now() + 90000000).toISOString(),
            instructor: 'Test Coach',
            location: 'Main Gym'
        }).select().single();

        await page.goto('/');
        await isHydrated(page);
        // Refresh to ensure session is loaded
        await page.reload();
        await isHydrated(page);

        await expect(page.getByText(/private coaching/i)).toBeVisible({ timeout: 20000 });

        if (session) await supabase.from('sessions').delete().eq('id', session.id);
    });

    // 10. Transaction History Visibility
    test('10. Transaction History Fetch', async ({ page }) => {
        await supabase.from('transactions').insert({
            user_id: playerId,
            amount: 50,
            type: 'CREDIT_PURCHASE',
            status: 'COMPLETED',
            description: 'QA Test Transaction'
        });

        await page.goto('/login');
        await page.fill('input[type="email"]', playerEmail);
        await page.fill('input[type="password"]', playerPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
        await isHydrated(page);

        // Open settings
        await page.locator('.lucide-settings').first().click();

        // Wait for Transaction History button
        await page.getByText(/transaction history/i).click();

        await expect(page.getByText(/qa test transaction/i)).toBeVisible({ timeout: 15000 });
    });
});
