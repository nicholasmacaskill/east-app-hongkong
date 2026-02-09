import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GOLF STATS TESTS
 * 
 * Verifies:
 * 1. Player can upload golf stats.
 * 2. Stats are persisted in the DB.
 * 3. Leaderboard updates with new values.
 */

test.describe('Golf Stats System', () => {
    let testUserId: string;
    let testUserEmail: string;

    test.beforeEach(async () => {
        testUserEmail = `golf-test-${Date.now()}@east.com`;

        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email: testUserEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'Golf', last_name: 'Pro' }
        });

        if (createError) throw createError;
        testUserId = userData.user.id;

        await supabase.from('profiles').upsert({
            id: testUserId,
            role: 'player',
            first_name: 'Golf',
            last_name: 'Pro',
            credits: 0
        });
    });

    test.afterEach(async () => {
        if (testUserId) {
            await supabase.auth.admin.deleteUser(testUserId);
        }
    });

    test('Stat Upload: Updates player stats and reflect on leaderboard', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

        // 1. Clear state to ensure clean login
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());

        // 2. Log in
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        console.log('Filling login form for:', testUserEmail);
        await page.fill('#email', testUserEmail);
        await page.fill('#password', 'TestPassword123!');
        await page.click('button:has-text("LOGIN")');

        console.log('Waiting for redirect to home...');
        // 3. Wait for Home Screen (redirect after login)
        await page.waitForURL(url => url.origin === 'http://localhost:3000' && url.pathname === '/', { timeout: 15000 });

        console.log('Verifying home screen content...');
        await expect(page.locator('h2:has-text("Breaking News")')).toBeVisible({ timeout: 10000 });

        // 3. Go to Profile Tab
        await page.click('button:has-text("Profile")');
        await expect(page.locator('h2:has-text("GOLF")').first()).toBeVisible();

        // 4. Open Update Stats Modal (Activity icon button)
        await page.click('button[title="Update Stats"]');
        await expect(page.locator('h2:has-text("Upload Golf Stats")')).toBeVisible();

        // 5. Fill and Save
        await page.fill('input[name="handicap"]', '10.5');
        await page.fill('input[name="rounds_played"]', '25');
        await page.fill('input[name="average_score"]', '82');
        await page.fill('input[name="best_score"]', '75');
        await page.fill('input[name="driver_distance"]', '280');

        await page.click('button:has-text("Save Stats")');

        // Wait for modal to close
        await expect(page.locator('h2:has-text("Upload Golf Stats")')).not.toBeVisible();

        // 6. Verify success in DB
        const { data: stats } = await supabase
            .from('golf_stats')
            .select('*')
            .eq('player_id', testUserId)
            .single();

        expect(stats).toBeDefined();
        expect(stats.handicap).toBe(10.5);
        expect(stats.driver_distance).toBe(280);

        // 7. Verify leaderboard presence
        await page.goto('/stats');

        // Switch to Golf
        await page.click('button:has-text("Golf")');

        // Verify player appears (Golf Pro is the name from beforeAll)
        await expect(page.locator('h3:has-text("Golf Pro")')).toBeVisible();

        // Verify a stat appears (e.g. 25 rounds or 280 distance depending on default filter)
        // Default filter for golf in UI is 'rounds' (from fetchDynamicEntries auto-tab logic or default)
        await expect(page.locator('div:has-text("25")').first()).toBeVisible();
    });
});
