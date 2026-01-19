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
        // 1. Log in
        await page.goto('/login');
        await page.fill('input[type="email"]', testUserEmail);
        await page.fill('input[type="password"]', 'TestPassword123!');
        await page.click('button[type="submit"]');

        // 2. Go to Stats Page
        await page.goto('/stats');

        // 3. Switch to Golf
        await page.click('button:has-text("Golf")');

        // 4. Open Upload Modal
        await page.click('button:has-text("Upload Stats")');

        // 5. Fill and Save
        await page.fill('input[name="handicap"]', '10.5');
        await page.fill('input[name="rounds_played"]', '25');
        await page.fill('input[name="average_score"]', '82');
        await page.fill('input[name="best_score"]', '75');
        await page.fill('input[name="driver_distance"]', '280');

        await page.click('button:has-text("Save Stats")');

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
        await expect(page.locator('h3:has-text("Golf Pro")')).toBeVisible();
        await expect(page.locator('div:has-text("280")').first()).toBeVisible();
    });
});
