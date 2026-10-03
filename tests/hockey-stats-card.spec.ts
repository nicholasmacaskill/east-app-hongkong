import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { parseTournamentTable } from '../app/lib/tournamentParser';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('EAST Stars Hockey Stats, Team Roster & Player Comparison', () => {
    let testUserId1: string;
    let testUserEmail1: string;
    let testUserId2: string;
    let testUserEmail2: string;

    test.beforeAll(async () => {
        const suffix = Date.now();

        // 1. Create Athlete 1: Lucas Wong
        testUserEmail1 = `lucas-wong-${suffix}@east.com`;
        const { data: u1, error: err1 } = await supabase.auth.admin.createUser({
            email: testUserEmail1,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'Lucas', last_name: 'Wong' },
        });
        if (err1) throw err1;
        testUserId1 = u1.user!.id;

        await supabase.from('profiles').upsert({
            id: testUserId1,
            role: 'player',
            first_name: 'Lucas',
            last_name: 'Wong',
            team: 'U13 EAST Stars (25/26)',
            username: `lucasw${suffix}`,
            bio: 'EAST Stars sniper chasing the cup.',
        });

        // 2. Create Athlete 2: Marcus Chen
        testUserEmail2 = `marcus-chen-${suffix}@east.com`;
        const { data: u2, error: err2 } = await supabase.auth.admin.createUser({
            email: testUserEmail2,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'Marcus', last_name: 'Chen' },
        });
        if (err2) throw err2;
        testUserId2 = u2.user!.id;

        await supabase.from('profiles').upsert({
            id: testUserId2,
            role: 'player',
            first_name: 'Marcus',
            last_name: 'Chen',
            team: 'U13 EAST Stars (25/26)',
            username: `marcusc${suffix}`,
            bio: 'Playmaker playmaker.',
        });
    });

    test.afterAll(async () => {
        if (testUserId1) {
            await supabase.from('player_hockey_stats').delete().eq('player_id', testUserId1);
            await supabase.from('profiles').delete().eq('id', testUserId1);
            await supabase.auth.admin.deleteUser(testUserId1);
        }
        if (testUserId2) {
            await supabase.from('player_hockey_stats').delete().eq('player_id', testUserId2);
            await supabase.from('profiles').delete().eq('id', testUserId2);
            await supabase.auth.admin.deleteUser(testUserId2);
        }
    });

    test('1. Automated Parser extracts table data and matches athlete profiles', () => {
        const sampleTable = `
#\tPlayer\tPos\tGP\tG\tA\tPTS\tPIM\tPPG\tSHG\tGWG
88\tWong, Lucas (C)\tF\t5\t4\t3\t7\t2\t1\t0\t1
97\tChen, Marcus (A)\tF\t5\t2\t6\t8\t0\t0\t0\t1
14\tUnknown, Player\tD\t5\t0\t2\t2\t4\t0\t0\t0
`;
        const mockProfiles = [
            {
                id: testUserId1,
                first_name: 'Lucas',
                last_name: 'Wong',
                username: 'lucasw',
                team: 'U13 EAST Stars (25/26)',
            },
            {
                id: testUserId2,
                first_name: 'Marcus',
                last_name: 'Chen',
                username: 'marcusc',
                team: 'U13 EAST Stars (25/26)',
            },
        ];

        const parsed = parseTournamentTable(sampleTable, mockProfiles, 'U13');
        expect(parsed.length).toBe(3);

        // Verify Lucas Wong match
        const lucasRow = parsed[0];
        expect(lucasRow.raw_name).toBe('Lucas Wong');
        expect(lucasRow.jersey_number).toBe(88);
        expect(lucasRow.position).toBe('F');
        expect(lucasRow.points).toBe(7);
        expect(lucasRow.matched_profile?.id).toBe(testUserId1);
        expect(lucasRow.match_confidence).toBe('exact');

        // Verify Marcus Chen match
        const marcusRow = parsed[1];
        expect(marcusRow.raw_name).toBe('Marcus Chen');
        expect(marcusRow.points).toBe(8);
        expect(marcusRow.matched_profile?.id).toBe(testUserId2);

        // Verify Unmatched row
        const unknownRow = parsed[2];
        expect(unknownRow.matched_profile).toBeNull();
        expect(unknownRow.match_confidence).toBe('unmatched');
    });

    test('2. Batch Save API ingests tournament stats for both players', async ({ request }) => {
        const payload = {
            season: '2024-25',
            team_name: 'U13 EAST Stars (25/26)',
            division: 'U13',
            competition_name: 'Quebec International Pee-Wee Tournament',
            competition_type: 'TOURNAMENT' as const,
            stats: [
                {
                    player_id: testUserId1,
                    position_type: 'SKATER' as const,
                    jersey_number: 88,
                    position: 'F',
                    gp: 5,
                    goals: 4,
                    assists: 3,
                    points: 7,
                    pim: 2,
                    ppg: 1,
                    shg: 0,
                    gwg: 1,
                    accolades: ['Quebec International Pee-Wee Tournament'],
                },
                {
                    player_id: testUserId2,
                    position_type: 'SKATER' as const,
                    jersey_number: 97,
                    position: 'F',
                    gp: 5,
                    goals: 2,
                    assists: 6,
                    points: 8,
                    pim: 0,
                    ppg: 0,
                    shg: 0,
                    gwg: 1,
                    accolades: ['Quebec International Pee-Wee Tournament'],
                },
            ],
        };

        const saveRes = await request.post('/api/admin/hockey-stats/batch-save', {
            data: payload,
        });
        expect(saveRes.ok()).toBeTruthy();
        const saveJson = await saveRes.json();
        expect(saveJson.success).toBe(true);
        expect(saveJson.savedCount).toBe(2);

        // Fetch stats via player endpoint for player 1
        const getRes = await request.get(`/api/hockey-stats/${testUserId1}`);
        expect(getRes.ok()).toBeTruthy();
        const getJson = await getRes.json();
        expect(getJson.success).toBe(true);
        expect(getJson.stats.length).toBe(1);
        expect(getJson.careerTotals.total_points).toBe(7);
    });

    test('3. Player Profile loads the Digital Hockey Card with Flip ledger interaction', async ({ page }) => {
        await page.goto(`/profile/${testUserId1}`);

        // Ensure page loaded with heading
        const playerHeading = page.getByRole('heading', { name: /lucas/i }).first();
        await expect(playerHeading).toBeVisible({ timeout: 15000 });

        // Verify Hockey Card Front is visible
        await expect(page.getByText('EAST STARS', { exact: false }).first()).toBeVisible();
        await expect(page.getByText('#88').first()).toBeVisible();
        await expect(page.getByText(/QUEBEC INTERNATIONAL PEE-WEE TOURNAMENT/i).first()).toBeVisible();

        // Check Front Quick-Hit Stats
        await expect(page.getByText('GOALS', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('ASSISTS', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('PTS', { exact: true }).first()).toBeVisible();

        // Click FLIP to reveal Career Ledger on Back of Card
        const flipBtn = page.getByRole('button', { name: /flip/i }).first();
        await flipBtn.click();

        // Verify Career Tournament Ledger is displayed
        await expect(page.getByText('CAREER TOURNAMENT LEDGER')).toBeVisible();
        await expect(page.getByText('ALL-TIME EAST CAREER TOTALS')).toBeVisible();
    });

    test('4. Team Roster & Stats (Elite Prospects) view on /stats displays scoring table and card preview', async ({ page }) => {
        await page.goto('/stats');

        // Verify Elite Prospects Team header is present
        await expect(page.getByRole('button', { name: /EAST Stars Teams \(Elite Prospects\)/i })).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('EAST Stars U13 Team Roster & Stats')).toBeVisible();

        // Verify Elite Prospects Skater Table Columns
        await expect(page.getByRole('table').first()).toBeVisible();
        await expect(page.getByText('PTS', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('PTS/G', { exact: true }).first()).toBeVisible();

        // Check seeded players in roster table
        await expect(page.getByText('Lucas Wong').first()).toBeVisible();
        await expect(page.getByText('Marcus Chen').first()).toBeVisible();

        // Click a player row to open the Hockey Card modal preview
        await page.getByText('Lucas Wong').first().click();

        // Verify modal opened with card
        await expect(page.getByText('#88').first()).toBeVisible();
    });

    test('5. Head-to-head Player Comparison on /stats compares athletes with Tale of the Tape and side-by-side cards', async ({ page }) => {
        await page.goto('/stats');

        // Switch to Compare Players mode
        const compareModeBtn = page.getByRole('button', { name: /Compare Players/i });
        await compareModeBtn.click();

        // Verify Comparison header
        await expect(page.getByText('Elite Prospects Player Comparison')).toBeVisible();
        await expect(page.getByText('Tale of the Tape • Career Performance')).toBeVisible();

        // Verify Side-by-Side Hockey Cards section
        await expect(page.getByText('Collectible Hockey Cards • Interactive 3D Cards')).toBeVisible();

        // Verify Comparison Metrics like Total Points and Total Goals are displayed
        await expect(page.getByText('TOTAL POINTS').first()).toBeVisible();
        await expect(page.getByText('TOTAL GOALS').first()).toBeVisible();
        await expect(page.getByText('TOTAL ASSISTS').first()).toBeVisible();

        // Verify Swap button is interactive
        const swapBtn = page.getByTitle('Swap athletes');
        await expect(swapBtn).toBeVisible();
        await swapBtn.click();
    });
});
