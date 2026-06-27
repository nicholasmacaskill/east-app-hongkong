import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

test.describe('Player Profile Search & Personal Stats', () => {
    const uniqueSuffix = Date.now();
    const firstName = 'PWSearch';
    const lastName = `Stats${uniqueSuffix}`;
    const searchQuery = firstName;
    const teamName = 'SEARCH TEAM';
    const password = 'TestPassword123!';

    let playerId: string;
    let coachEmail: string;

    test.beforeAll(async () => {
        coachEmail = `pw-coach-${uniqueSuffix}@east.com`;

        const { data: coachData, error: coachError } = await supabase.auth.admin.createUser({
            email: coachEmail,
            password,
            email_confirm: true,
            user_metadata: { role: 'coach', first_name: 'PW', last_name: 'Coach' },
        });
        if (coachError) throw coachError;

        await supabase.from('profiles').upsert({
            id: coachData.user.id,
            role: 'coach',
            first_name: 'PW',
            last_name: 'Coach',
            contact_email: coachEmail,
        });

        const playerEmail = `pw-search-${uniqueSuffix}@east.com`;

        const { data, error } = await supabase.auth.admin.createUser({
            email: playerEmail,
            password,
            email_confirm: true,
            user_metadata: { role: 'player', first_name: firstName, last_name: lastName },
        });

        if (error) throw error;
        playerId = data.user.id;

        const { error: profileError } = await supabase.from('profiles').upsert({
            id: playerId,
            role: 'player',
            first_name: firstName,
            last_name: lastName,
            team: teamName,
            username: `pwsearch${uniqueSuffix}`,
        });

        if (profileError) throw profileError;

        const { error: statsError } = await supabase.from('players_stats').upsert({
            player_id: playerId,
            category: 'GOLF',
            stats: {
                handicap: 14,
                longest_drive: 275,
                tournament_wins: 2,
            },
            is_verified: true,
            verified: true,
        });

        if (statsError) throw statsError;
    });

    test.afterAll(async () => {
        const { data: coach } = await supabase.from('profiles').select('id').eq('contact_email', coachEmail).maybeSingle();
        if (coach?.id) {
            await supabase.from('profiles').delete().eq('id', coach.id);
            await supabase.auth.admin.deleteUser(coach.id);
        }

        if (!playerId) return;

        await supabase.from('players_stats').delete().eq('player_id', playerId);
        await supabase.from('profiles').delete().eq('id', playerId);
        await supabase.auth.admin.deleteUser(playerId);
    });

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('#email', coachEmail);
        await page.fill('#password', password);
        await page.click('button:has-text("LOGIN")');
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    });

    test('search on leaderboard finds player and opens profile with personal stats', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('networkidle');

        await expect(page.getByTestId('player-search')).toBeVisible();

        const searchInput = page.getByTestId('player-search-input');
        await searchInput.fill(searchQuery);

        const result = page.getByTestId(`player-search-result-${playerId}`);
        await expect(result).toBeVisible({ timeout: 15000 });

        await result.click();

        await page.waitForURL(new RegExp(`/profile/${playerId}$`), { timeout: 15000 });

        await expect(page.getByRole('heading', { name: new RegExp(firstName, 'i') })).toBeVisible();

        const golfSection = page.locator('div').filter({ hasText: 'GOLF PERFORMANCE' }).last();
        await expect(golfSection).toBeVisible({ timeout: 10000 });
        await expect(golfSection.getByText('Handicap')).toBeVisible();
        await expect(golfSection.getByText('14')).toBeVisible();
        await expect(golfSection.getByText('Longest Drive')).toBeVisible();
        await expect(golfSection.getByText('275')).toBeVisible();
        await expect(golfSection.getByText('Tournament Wins')).toBeVisible();
    });

    test('leaderboard row click opens player profile with personal stats', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('networkidle');

        const playerRow = page.locator(`a[href="/profile/${playerId}"]`).first();
        await expect(playerRow).toBeVisible({ timeout: 15000 });
        await playerRow.click();

        await page.waitForURL(new RegExp(`/profile/${playerId}$`), { timeout: 15000 });
        const golfSection = page.locator('div').filter({ hasText: 'GOLF PERFORMANCE' }).last();
        await expect(golfSection).toBeVisible({ timeout: 10000 });
        await expect(golfSection.getByText('Handicap')).toBeVisible();
        await expect(golfSection.getByText('14')).toBeVisible();
    });

    test('direct profile URL loads personal stats when authenticated', async ({ page }) => {
        await page.goto(`/profile/${playerId}`);
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('heading', { name: new RegExp(firstName, 'i') })).toBeVisible({ timeout: 10000 });

        const golfSection = page.locator('div').filter({ hasText: 'GOLF PERFORMANCE' }).last();
        await expect(golfSection).toBeVisible();
        await expect(golfSection.getByText('Handicap')).toBeVisible();
        await expect(golfSection.getByText('14')).toBeVisible();
        await expect(page.getByText('No stats verified yet')).not.toBeVisible();
    });
});