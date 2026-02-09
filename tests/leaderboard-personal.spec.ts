import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

test.describe('Leaderboard - Personal Stats', () => {
    let testUserId: string;
    let testUserEmail: string;

    test.beforeAll(async () => {
        // Create a test user
        testUserEmail = `test-user-${Date.now()}@example.com`;
        const { data, error } = await supabase.auth.admin.createUser({
            email: testUserEmail,
            password: 'password123',
            email_confirm: true,
            user_metadata: { role: 'player' }
        });

        if (error) throw error;
        testUserId = data.user.id;

        // Update profile
        await supabase.from('profiles').upsert({
            id: testUserId,
            first_name: 'Personal',
            last_name: 'Test User',
            team: 'TESTING',
            role: 'player'
        });

        // Add stats for the user that place them outside top 10
        // We'll add 11 other players with better scores
        for (let i = 1; i <= 11; i++) {
            const { data: pData } = await supabase.auth.admin.createUser({
                email: `other-player-${i}-${Date.now()}@example.com`,
                password: 'password123'
            });
            const pId = pData.user!.id;

            await supabase.from('profiles').upsert({
                id: pId,
                first_name: `Top`,
                last_name: `Player ${i}`,
                team: 'TOP TEAM',
                role: 'player'
            });

            await supabase.from('players_stats').insert({
                player_id: pId,
                category: 'golf',
                stats: { handicap: i },
                verified: true
            });
        }

        // Add stats for test user (rank 12)
        await supabase.from('players_stats').insert({
            player_id: testUserId,
            category: 'golf',
            stats: { handicap: 20 },
            verified: true
        });
    });

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    });

    test.afterAll(async () => {
        // Cleanup all test users starting with other-player and our test user
        const { data: others } = await supabase.from('profiles')
            .select('id')
            .ilike('first_name', 'Top')
            .ilike('last_name', 'Player %');

        const idsToDelete = [testUserId, ...(others?.map(o => o.id) || [])];

        for (const id of idsToDelete) {
            await supabase.from('players_stats').delete().eq('player_id', id);
            await supabase.from('profiles').delete().eq('id', id);
            await supabase.auth.admin.deleteUser(id);
        }
    });

    test('Should show current user rank even if outside top 10', async ({ page }) => {
        // Log in as test user
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('networkidle');

        await page.fill('input[type="email"]', testUserEmail);
        await page.fill('input[type="password"]', 'password123');

        const loginBtn = page.getByRole('button', { name: /Sign In|Login/i }).first();
        await loginBtn.click();

        await page.waitForURL('http://localhost:3000');

        // Go to stats
        await page.goto('http://localhost:3000/stats');
        await page.waitForLoadState('networkidle');

        // Select Golf and Handicap (defaults)

        // Verify "Your Performance" section is visible
        await expect(page.getByText('Your Performance')).toBeVisible({ timeout: 10000 });

        // Verify Personal Test User is visible in that section
        await expect(page.getByText('Personal Test User')).toBeVisible();

        // Verify it's a rank > 10
        // Use a more specific selector for the rank in the performance section
        const performanceSection = page.locator('div.bg-east-dark\\/50').filter({ hasText: 'Your Performance' });
        const rankDiv = performanceSection.locator('div.text-2xl').filter({ hasText: /^\d+/ }).first();
        const rankText = await rankDiv.innerText();
        console.log('Detected Personal Rank:', rankText);
        expect(parseInt(rankText)).toBeGreaterThan(10);
    });

    test('Should highlight current user if inside top 10', async ({ page }) => {
        // Update stats to make user rank 1
        await supabase.from('players_stats').update({
            stats: { handicap: 0 }
        }).eq('player_id', testUserId);

        await page.goto('http://localhost:3000/stats');
        await page.waitForLoadState('networkidle');

        // Select Golf
        await page.locator('button:has-text("Golf")').first().click();
        await page.waitForTimeout(1000);

        // Verify "YOU" badge in the main list
        const youBadge = page.locator('div.group.relative').filter({ hasText: 'YOU' });
        await expect(youBadge).toBeVisible();

        // Verify "Your Performance" is NOT visible (since they are in top 10)
        await expect(page.getByText('Your Performance')).not.toBeVisible();
    });
});
