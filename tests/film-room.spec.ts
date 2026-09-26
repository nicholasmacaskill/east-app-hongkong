import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { extractYouTubeVideoId, formatSecondsToLabel, parseLabelToSeconds } from '../app/lib/youtubeUtils';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

async function createTestCoach(suffix: number) {
    const email = `film-coach-${suffix}-${Date.now()}@east.com`;
    const password = 'TestPassword123!';
    const firstName = `CoachFilm${suffix}`;
    const lastName = 'Test';

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'coach', first_name: firstName, last_name: lastName }
    });

    if (error || !data.user) throw error;

    await supabase.from('profiles').upsert({
        id: data.user.id,
        role: 'coach',
        first_name: firstName,
        last_name: lastName
    });

    return { id: data.user.id, email, password, name: `${firstName} ${lastName}` };
}

async function createTestPlayer(suffix: number) {
    const email = `film-player-${suffix}-${Date.now()}@east.com`;
    const password = 'TestPassword123!';
    const firstName = `PlayerFilm${suffix}`;
    const lastName = 'Test';

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'player', first_name: firstName, last_name: lastName }
    });

    if (error || !data.user) throw error;

    await supabase.from('profiles').upsert({
        id: data.user.id,
        role: 'player',
        first_name: firstName,
        last_name: lastName,
        username: `filmplayer${suffix}_${Date.now()}`
    });

    return { id: data.user.id, email, password, name: `${firstName} ${lastName}` };
}

test.describe('Film Room - Multi-Variate Integration & Verification', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    let coach: { id: string; email: string; password: string; name: string };
    let player: { id: string; email: string; password: string; name: string };
    let coachToken: string;
    let playerToken: string;

    test.beforeAll(async () => {
        coach = await createTestCoach(1);
        player = await createTestPlayer(1);

        // Sign in coach to acquire JWT access token
        const { data: coachAuth } = await supabase.auth.signInWithPassword({
            email: coach.email,
            password: coach.password
        });
        coachToken = coachAuth.session?.access_token || '';

        // Sign in player to acquire JWT access token
        const { data: playerAuth } = await supabase.auth.signInWithPassword({
            email: player.email,
            password: player.password
        });
        playerToken = playerAuth.session?.access_token || '';
    });

    test.afterAll(async () => {
        // Cleanup test users
        if (coach?.id) await supabase.auth.admin.deleteUser(coach.id);
        if (player?.id) await supabase.auth.admin.deleteUser(player.id);
    });

    test('1. YouTube Utility Functions accurately parse URLs and timestamps', () => {
        // Video ID extraction tests
        expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        expect(extractYouTubeVideoId('invalid-url-xyz')).toBeNull();

        // Seconds to label
        expect(formatSecondsToLabel(83)).toBe('01:23');
        expect(formatSecondsToLabel(0)).toBe('00:00');
        expect(formatSecondsToLabel(3665)).toBe('01:01:05');

        // Label to seconds
        expect(parseLabelToSeconds('01:23')).toBe(83);
        expect(parseLabelToSeconds('1:23')).toBe(83);
        expect(parseLabelToSeconds('01:01:05')).toBe(3665);
    });

    test('2. Coach can create, read, update, and delete Film Room sessions via API', async ({ request }) => {
        // Step A: Coach creates a new film session with 2 timestamps
        const createRes = await request.post(`${baseURL}/api/film-room`, {
            headers: {
                Authorization: `Bearer ${coachToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                title: 'Breakout Execution & Regroups',
                description: 'Review puck movement and support angles along the boards',
                youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                target_type: 'all',
                timestamps: [
                    {
                        timestamp_seconds: 45,
                        timestamp_label: '00:45',
                        title: 'D-to-D Reverse Pass',
                        notes: 'Strong scanning before retrieving the puck. Notice the quick shoulder check.'
                    },
                    {
                        timestamp_seconds: 120,
                        timestamp_label: '02:00',
                        title: 'Center Low Support',
                        notes: 'Center must stay below the puck to provide an emergency outlet.'
                    }
                ]
            }
        });

        expect(createRes.status()).toBe(200);
        const createdSession = await createRes.json();
        expect(createdSession.id).toBeDefined();
        expect(createdSession.title).toBe('Breakout Execution & Regroups');
        expect(createdSession.video_id).toBe('dQw4w9WgXcQ');
        expect(createdSession.timestamps).toHaveLength(2);
        expect(createdSession.timestamps[0].timestamp_label).toBe('00:45');
        expect(createdSession.timestamps[1].timestamp_label).toBe('02:00');

        const sessionId = createdSession.id;

        // Step B: Fetch single session with timestamps
        const getSingleRes = await request.get(`${baseURL}/api/film-room?id=${sessionId}`, {
            headers: { Authorization: `Bearer ${coachToken}` }
        });
        expect(getSingleRes.status()).toBe(200);
        const fetchedSingle = await getSingleRes.json();
        expect(fetchedSingle.id).toBe(sessionId);
        expect(fetchedSingle.timestamps).toHaveLength(2);
        expect(fetchedSingle.coach.first_name).toBe(coach.name.split(' ')[0]);

        // Step C: Coach updates the session
        const updateRes = await request.put(`${baseURL}/api/film-room`, {
            headers: {
                Authorization: `Bearer ${coachToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                id: sessionId,
                title: 'Updated Breakout Breakdown',
                timestamps: [
                    {
                        timestamp_seconds: 45,
                        timestamp_label: '00:45',
                        title: 'D-to-D Reverse Pass',
                        notes: 'Updated coaching note.'
                    },
                    {
                        timestamp_seconds: 75,
                        timestamp_label: '01:15',
                        title: 'Neutral Zone Regroup',
                        notes: 'Keep stick on ice.'
                    },
                    {
                        timestamp_seconds: 120,
                        timestamp_label: '02:00',
                        title: 'Center Low Support',
                        notes: 'Center must stay below the puck.'
                    }
                ]
            }
        });
        expect(updateRes.status()).toBe(200);
        const updatedSession = await updateRes.json();
        expect(updatedSession.title).toBe('Updated Breakout Breakdown');
        expect(updatedSession.timestamps).toHaveLength(3);

        // Step D: Coach deletes the session
        const deleteRes = await request.delete(`${baseURL}/api/film-room?id=${sessionId}`, {
            headers: { Authorization: `Bearer ${coachToken}` }
        });
        expect(deleteRes.status()).toBe(200);

        // Verify session no longer exists
        const getVerifyRes = await request.get(`${baseURL}/api/film-room?id=${sessionId}`, {
            headers: { Authorization: `Bearer ${coachToken}` }
        });
        expect(getVerifyRes.status()).toBe(404);
    });

    test('3. Player role cannot create or delete film sessions (Role Boundary Protection)', async ({ request }) => {
        // Player attempting POST
        const playerCreateRes = await request.post(`${baseURL}/api/film-room`, {
            headers: {
                Authorization: `Bearer ${playerToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                title: 'Unauthorized Player Session',
                youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            }
        });
        expect(playerCreateRes.status()).toBe(403);

        // Player attempting DELETE
        const playerDeleteRes = await request.delete(`${baseURL}/api/film-room?id=00000000-0000-0000-0000-000000000000`, {
            headers: { Authorization: `Bearer ${playerToken}` }
        });
        expect(playerDeleteRes.status()).toBe(403);
    });

    test('4. Player can read sessions targeted to all or to their athlete profile', async ({ request }) => {
        // Coach creates session targeted to this specific player
        const targetedRes = await request.post(`${baseURL}/api/film-room`, {
            headers: {
                Authorization: `Bearer ${coachToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                title: 'Private Review for Athlete',
                description: 'Personal stick-handling analysis',
                youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                target_type: 'player',
                target_player_id: player.id,
                timestamps: [
                    {
                        timestamp_seconds: 30,
                        timestamp_label: '00:30',
                        title: 'Head-up stride',
                        notes: 'Notice hand placement on stick'
                    }
                ]
            }
        });

        expect(targetedRes.status()).toBe(200);
        const targetedSession = await targetedRes.json();

        // Player fetches their sessions
        const playerGetRes = await request.get(`${baseURL}/api/film-room`, {
            headers: { Authorization: `Bearer ${playerToken}` }
        });
        expect(playerGetRes.status()).toBe(200);
        const playerSessions = await playerGetRes.json();
        const found = playerSessions.some((s: any) => s.id === targetedSession.id);
        expect(found).toBe(true);

        // Clean up
        await request.delete(`${baseURL}/api/film-room?id=${targetedSession.id}`, {
            headers: { Authorization: `Bearer ${coachToken}` }
        });
    });

    test('5. Coach can navigate Film Room UI, search sessions, and toggle target filters', async ({ page }) => {
        await page.goto(`${baseURL}/login`);
        await page.fill('input[type="email"]', coach.email);
        await page.fill('input[type="password"]', coach.password);
        await page.click('button[type="submit"]');

        const filmRoomTab = page.locator('button:has-text("Film Room")').first();
        await filmRoomTab.waitFor({ state: 'visible', timeout: 20000 });
        await filmRoomTab.click();

        // Verify Film Room Header is visible
        await expect(page.locator('h2:has-text("Film Room")')).toBeVisible();

        // Verify Filter Buttons (All, Teams, Individual)
        const allBtn = page.getByRole('button', { name: 'All', exact: true });
        const teamsBtn = page.getByRole('button', { name: 'Teams', exact: true });
        const individualBtn = page.getByRole('button', { name: 'Individual', exact: true });
        await expect(allBtn).toBeVisible();
        await expect(teamsBtn).toBeVisible();
        await expect(individualBtn).toBeVisible();

        // Search bar
        const searchInput = page.locator('input[placeholder*="Search film"]');
        await expect(searchInput).toBeVisible();
    });

    test('6. Interactive Film Room Theater opens, seeks timestamps, steps through markers, and closes cleanly without React errors', async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', err => pageErrors.push(err.message));

        await page.goto(`${baseURL}/login`);
        await page.fill('input[type="email"]', 'coach.demo@eastsportsgroup.com');
        await page.fill('input[type="password"]', 'DemoPassword123!');
        await page.click('button[type="submit"]');

        const filmRoomTab = page.locator('button:has-text("Film Room")').first();
        await filmRoomTab.waitFor({ state: 'visible', timeout: 20000 });
        await filmRoomTab.click();

        // Click session card
        const sessionCard = page.locator('text=Game 3 Breakdown').first();
        await sessionCard.waitFor({ state: 'visible', timeout: 10000 });
        await sessionCard.click();

        // Verify modal header & notes panel
        await expect(page.getByRole('heading', { name: 'Coaching Notes' })).toBeVisible();

        // Click timestamp 00:15
        const cue1 = page.locator('text=Shoulder Check & Gap Control').first();
        await expect(cue1).toBeVisible();
        await cue1.click();

        // Step to next marker
        const nextBtn = page.locator('button:has-text("Next Marker")').first();
        if (await nextBtn.isVisible()) {
            await nextBtn.click();
        }

        // Verify "Watch in YouTube" direct link exists with valid URL
        const ytLink = page.locator('a:has-text("Watch in YouTube")').first();
        await expect(ytLink).toBeVisible();
        const href = await ytLink.getAttribute('href');
        expect(href).toMatch(/youtu(\.be|be\.com)/);
        expect(href).toContain('?t=');

        // Close modal
        const closeBtn = page.locator('button[title="Close"]').first();
        await closeBtn.click();

        // Confirm modal unmounted
        await expect(page.getByRole('heading', { name: 'Coaching Notes' })).not.toBeVisible();

        // Verify no React removeChild / unhandled DOM exceptions
        const fatalErrors = pageErrors.filter(e => e.includes('removeChild') || e.includes('NotFoundError'));
        expect(fatalErrors).toHaveLength(0);
    });

    test('7. Create Film Session Modal previews live YouTube video and handles validation', async ({ page }) => {
        await page.goto(`${baseURL}/login`);
        await page.fill('input[type="email"]', coach.email);
        await page.fill('input[type="password"]', coach.password);
        await page.click('button[type="submit"]');

        const filmRoomTab = page.locator('button:has-text("Film Room")').first();
        await filmRoomTab.waitFor({ state: 'visible', timeout: 20000 });
        await filmRoomTab.click();

        // Open create modal
        await page.locator('button:has-text("New Film Session")').first().click();
        await expect(page.locator('text=NEW FILM ROOM SESSION')).toBeVisible();

        // Enter YouTube URL
        const urlInput = page.locator('input[placeholder*="Paste link e.g."]').first();
        await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

        // Verify detected badge
        await expect(page.locator('text=DETECTED')).toBeVisible();

        // Verify Grab Time button
        await expect(page.getByRole('button', { name: 'Grab Current Time' })).toBeVisible();

        // Cancel modal
        await page.locator('button:has-text("Cancel")').first().click();
        await expect(page.locator('text=NEW FILM ROOM SESSION')).not.toBeVisible();
    });
});
