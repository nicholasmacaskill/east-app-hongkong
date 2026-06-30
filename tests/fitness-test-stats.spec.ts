import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { getLeaderboardFields, STAT_FIELDS } from '../app/lib/statFields';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('Fitness Test Stats', () => {
    let testUserId: string;
    let testUserEmail: string;

    test.beforeAll(async () => {
        const suffix = Date.now();
        testUserEmail = `fitness-test-${suffix}@east.com`;
        const { data, error } = await supabase.auth.admin.createUser({
            email: testUserEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'Fitness', last_name: 'Tester' },
        });
        if (error) throw error;
        testUserId = data.user!.id;

        const { error: profileError } = await supabase.from('profiles').upsert({
            id: testUserId,
            role: 'player',
            first_name: 'Fitness',
            last_name: 'Tester',
            team: 'TEST TEAM',
            username: `fitnesstest${suffix}`,
        });
        if (profileError) throw profileError;

        const { error: statsError } = await supabase.from('players_stats').upsert({
            player_id: testUserId,
            category: 'FITNESS_TEST',
            stats: {
                test: 'Spring Combine 2026',
                agility: '00:12',
                pushups: 45,
                squat_1rm: 120,
                vald_cmj: 38,
            },
            verified: true,
            is_verified: true,
        });
        if (statsError) throw statsError;
    });

    test.afterAll(async () => {
        if (testUserId) {
            await supabase.from('players_stats').delete().eq('player_id', testUserId);
            await supabase.auth.admin.deleteUser(testUserId);
        }
    });

    test('statFields defines all fitness test leaderboard metrics', () => {
        const fields = STAT_FIELDS.FITNESS_TEST.map((f) => f.label);
        expect(fields).toContain('Agility');
        expect(fields).toContain('Skating');
        expect(fields).toContain('Critical Power');
        expect(fields).toContain('Pushups');
        expect(fields).toContain('Long Jump');
        expect(fields).toContain('1RM Squat');
        expect(fields).toContain('VALD CMJ SL');

        const leaderboardFields = getLeaderboardFields('FITNESS_TEST');
        expect(leaderboardFields.some((f) => f.key === 'test')).toBe(false);
        expect(leaderboardFields.length).toBe(16);
    });

    const selectFitnessTest = async (page: import('@playwright/test').Page) => {
        const fitnessTab = page.locator('button').filter({ hasText: /^Fitness Test$/ });
        await fitnessTab.click();
        await expect(fitnessTab).toHaveClass(/bg-east-light/);
        await expect(page.getByRole('button', { name: 'Agility' })).toBeVisible({ timeout: 10000 });
    };

    test('leaderboard shows Fitness Test tab and stat filters', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('networkidle');

        await selectFitnessTest(page);

        await expect(page.getByRole('button', { name: 'Pushups' })).toBeVisible();
        await expect(page.getByRole('button', { name: '1RM Squat' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'VALD CMJ', exact: true })).toBeVisible();
    });

    test('leaderboard ranks fitness test stats and links to profile', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('networkidle');

        await selectFitnessTest(page);
        await page.getByRole('button', { name: 'Pushups' }).click();
        await page.waitForTimeout(1000);

        // Public leaderboard may show fallback name when profile RLS hides names for anon users
        const playerRow = page.locator('a[href*="/profile/"]').filter({ hasText: /45/ }).first();
        await expect(playerRow).toBeVisible({ timeout: 10000 });

        await playerRow.click();
        await expect(page).toHaveURL(new RegExp(`/profile/${testUserId}`));
    });

    test('player profile shows fitness test personal stats when authenticated', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[name="email"]', testUserEmail);
        await page.fill('input[name="password"]', 'TestPassword123!');
        await page.locator('button:has-text("LOGIN")').click({ force: true });
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

        await page.goto(`/profile/${testUserId}`);
        await page.waitForLoadState('networkidle');

        await expect(page.getByText('FITNESS TEST PERFORMANCE')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Spring Combine 2026')).toBeVisible();
        await expect(page.getByText('45')).toBeVisible();
        await expect(page.getByText('120')).toBeVisible();
    });
});

test.describe('Fitness Test CMS', () => {
    test('admin stats page includes Fitness Test category', async ({ page }) => {
        const timestamp = Date.now();
        const email = `fitness-admin-${timestamp}@east.com`;
        const password = 'admin-password-123';

        const { error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { first_name: 'Fitness', last_name: 'Admin', role: 'sys-admin' },
        });
        if (error) throw error;

        try {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');
            await page.fill('input[name="email"]', email);
            await page.fill('input[name="password"]', password);
            await page.locator('button:has-text("LOGIN")').click({ force: true });
            await page.waitForURL(/\/(sys-admin|admin-ops)/, { timeout: 15000 });

            await page.goto('/sys-admin/stats');
            await page.waitForLoadState('networkidle');

            await expect(page.getByRole('button', { name: '💪 Fitness Test' })).toBeVisible();
            await page.getByRole('button', { name: '💪 Fitness Test' }).click();
            await page.waitForTimeout(500);
            await expect(page.getByText(/Select a player to edit stats/i)).toBeVisible();
        } finally {
            const { data: users } = await supabase.auth.admin.listUsers();
            const admin = users.users.find((u) => u.email === email);
            if (admin) await supabase.auth.admin.deleteUser(admin.id);
        }
    });
});