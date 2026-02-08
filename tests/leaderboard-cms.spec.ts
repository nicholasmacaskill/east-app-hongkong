import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Leaderboard CMS', () => {
    let adminEmail: string;
    let adminId: string;

    test.beforeAll(async () => {
        adminEmail = `admin-test-${Date.now()}@east.com`;
        const password = 'TestPassword123!';

        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password,
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'Lead', last_name: 'Admin' }
        });

        if (createError) throw createError;
        adminId = userData.user.id;

        await supabase.from('profiles').upsert({
            id: adminId,
            role: 'sys-admin',
            first_name: 'Lead',
            last_name: 'Admin',
            contact_email: adminEmail
        });
    });

    test.afterAll(async () => {
        if (adminId) {
            await supabase.auth.admin.deleteUser(adminId);
            await supabase.from('leaderboard_entries').delete().ilike('name', 'TEST-%');
        }
    });

    test('Admin can create and edit leaderboard entries', async ({ page }) => {
        const password = 'TestPassword123!';

        // 1. Log in as admin
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        await page.fill('#email', adminEmail);
        await page.fill('#password', password);
        await page.click('button:has-text("LOGIN")');

        // 2. Navigate to Leaderboard CMS
        await page.waitForURL(/\/sys-admin/);
        await page.goto('/sys-admin/leaderboard');
        await expect(page.locator('h1:has-text("Leaderboard CMS")')).toBeVisible();

        // 3. Create a new entry
        await page.click('button:has-text("Add New Entry")');
        await page.fill('input[placeholder="Player Name or Team Name"]', 'TEST-PLAYER-2026');
        await page.fill('input[placeholder="e.g. RHINOS"]', 'ROCKETS');
        await page.fill('input[placeholder="All, U9, Pro, etc."]', 'U15');

        // Add a stat
        await page.fill('input[placeholder="Stat Key (e.g. goals)"]', 'goals');
        await page.fill('input[placeholder="Value"]', '99');
        await page.click('button[aria-label="Add Stat"]');

        await page.click('button:has-text("Save Entry")');

        // Wait for success toast
        await expect(page.locator('text=Leaderboard entry saved!')).toBeVisible();

        // 4. Verify in DB
        // Add a small delay to ensure DB propagation (though select().single() should be immediate)
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: entry } = await supabase
            .from('leaderboard_entries')
            .select('*')
            .eq('name', 'TEST-PLAYER-2026')
            .single();

        expect(entry).toBeDefined();
        expect(entry.stats.goals).toBe('99');
        expect(entry.division).toBe('U15');

        // 5. Verify on Public Page
        await page.goto('/stats');

        // Match filters
        await page.selectOption('select >> nth=0', '2025-2026 Winter');
        await page.selectOption('select >> nth=1', 'U15');

        // Verify player appears
        await expect(page.locator('h3:has-text("TEST-PLAYER-2026")')).toBeVisible();
        await expect(page.locator('div:has-text("99")').first()).toBeVisible();
    });
});
