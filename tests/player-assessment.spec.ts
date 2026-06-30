import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createCoach(suffix: number) {
    const email = `assessment-coach-${suffix}@east.com`;
    const password = 'TestPassword123!';
    const firstName = `AssessC${suffix}`;
    const lastName = 'Coach';
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'coach', first_name: firstName, last_name: lastName },
    });
    if (error || !data.user) throw error;
    await supabase.from('profiles').upsert({
        id: data.user.id,
        role: 'coach',
        first_name: firstName,
        last_name: lastName,
    });
    return { id: data.user.id, email, password, name: `${firstName} ${lastName}` };
}

async function createPlayer(suffix: number) {
    const email = `assessment-player-${suffix}@east.com`;
    const password = 'TestPassword123!';
    const firstName = `AssessP${suffix}`;
    const lastName = 'Player';
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'player', first_name: firstName, last_name: lastName },
    });
    if (error || !data.user) throw error;
    await supabase.from('profiles').upsert({
        id: data.user.id,
        role: 'player',
        first_name: firstName,
        last_name: lastName,
        username: `assessplayer${suffix}`,
    });
    return { id: data.user.id, email, password, name: `${firstName} ${lastName}` };
}

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

async function loginCoach(page: import('@playwright/test').Page, email: string, password: string) {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => document.body.innerText.includes('EAST COACH'), { timeout: 20000 });
}

async function logout(page: import('@playwright/test').Page) {
    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
}

async function loginPlayer(page: import('@playwright/test').Page, email: string, password: string) {
    await logout(page);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
}

async function getAccessToken(
    request: import('@playwright/test').APIRequestContext,
    email: string,
    password: string
) {
    const loginRes = await request.post(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Content-Type': 'application/json',
        },
        data: { email, password },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { access_token } = await loginRes.json();
    return access_token as string;
}

async function cleanupPlayerData(playerId: string) {
    await supabase.from('messages').delete().eq('receiver_id', playerId);
    const { data: assessments } = await supabase
        .from('player_assessments')
        .select('id')
        .eq('player_id', playerId);
    const ids = assessments?.map((r) => r.id) || [];
    if (ids.length) {
        await supabase.from('player_assessment_media').delete().in('assessment_id', ids);
    }
    await supabase.from('player_assessments').delete().eq('player_id', playerId);
}

const fixtureImage = path.resolve(__dirname, 'fixtures/test-assessment.png');

test.describe.configure({ mode: 'serial', retries: 1 });

test.describe('Private Player Assessments', () => {
    let coach: Awaited<ReturnType<typeof createCoach>>;
    let player: Awaited<ReturnType<typeof createPlayer>>;
    let otherPlayer: Awaited<ReturnType<typeof createPlayer>>;
    const testSuffix = Date.now();

    test.beforeAll(async () => {
        coach = await createCoach(testSuffix);
        player = await createPlayer(testSuffix);
        otherPlayer = await createPlayer(testSuffix + 1);
    });

    test.afterAll(async () => {
        if (player?.id) {
            await cleanupPlayerData(player.id);
            await supabase.auth.admin.deleteUser(player.id);
        }
        if (otherPlayer?.id) {
            await cleanupPlayerData(otherPlayer.id);
            await supabase.auth.admin.deleteUser(otherPlayer.id);
        }
        if (coach?.id) {
            await supabase.auth.admin.deleteUser(coach.id);
        }
    });

    test('API: coach can create assessment and player receives message', async ({ request }) => {
        const loginRes = await request.post(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            headers: {
                apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Content-Type': 'application/json',
            },
            data: { email: coach.email, password: coach.password },
        });
        expect(loginRes.ok()).toBeTruthy();
        const { access_token: token } = await loginRes.json();

        const createRes = await request.post(`${baseURL}/api/coach/assessments`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            data: {
                playerId: player.id,
                title: 'Skating Stride Review',
                notes: 'Great knee bend, work on arm swing.',
                media: [],
                sendToPlayer: true,
            },
        });
        expect(createRes.ok()).toBeTruthy();
        const assessment = await createRes.json();
        expect(assessment.title).toBe('Skating Stride Review');
        expect(assessment.player_id).toBe(player.id);

        const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('receiver_id', player.id)
            .eq('shared_assessment_id', assessment.id);
        expect(messages?.length).toBe(1);
    });

    test('API: player list endpoint returns assessments with expected shape', async ({ request }) => {
        const { data: assessment, error: assessmentError } = await supabase
            .from('player_assessments')
            .insert({
                coach_id: coach.id,
                player_id: player.id,
                title: 'API List Test Assessment',
                notes: 'Verifying list endpoint shape.',
            })
            .select()
            .single();
        if (assessmentError) throw assessmentError;

        await supabase.from('player_assessment_media').insert({
            assessment_id: assessment!.id,
            media_type: 'image',
            media_url: 'https://example.com/test-image.jpg',
            sort_order: 0,
        });

        const playerToken = await getAccessToken(request, player.email, player.password);
        const listRes = await request.get(`${baseURL}/api/player/assessments`, {
            headers: { Authorization: `Bearer ${playerToken}` },
        });
        expect(listRes.ok()).toBeTruthy();

        const list = await listRes.json();
        expect(Array.isArray(list)).toBeTruthy();
        expect(list.length).toBeGreaterThanOrEqual(1);

        const item = list.find((a: { title: string }) => a.title === 'API List Test Assessment');
        expect(item).toBeTruthy();
        expect(item).toMatchObject({
            id: assessment!.id,
            title: 'API List Test Assessment',
            coach_id: coach.id,
            coach_name: coach.name,
            media_count: 1,
            has_video: false,
        });
        expect(item.created_at).toBeTruthy();
        expect(typeof item.notes).toBe('string');

        const coachToken = await getAccessToken(request, coach.email, coach.password);
        const forbiddenRes = await request.get(`${baseURL}/api/player/assessments`, {
            headers: { Authorization: `Bearer ${coachToken}` },
        });
        expect(forbiddenRes.status()).toBe(403);

        const singleRes = await request.get(`${baseURL}/api/player/assessments?assessmentId=${assessment!.id}`, {
            headers: { Authorization: `Bearer ${playerToken}` },
        });
        expect(singleRes.ok()).toBeTruthy();
        const single = await singleRes.json();
        expect(single.id).toBe(assessment!.id);
        expect(single.title).toBe('API List Test Assessment');
        expect(Array.isArray(single.media)).toBeTruthy();
        expect(single.media.length).toBe(1);
    });

    test('API: rejects unauthenticated and cross-player access', async ({ request }) => {
        const coachToken = await getAccessToken(request, coach.email, coach.password);
        const createRes = await request.post(`${baseURL}/api/coach/assessments`, {
            headers: {
                Authorization: `Bearer ${coachToken}`,
                'Content-Type': 'application/json',
            },
            data: {
                playerId: player.id,
                title: 'Privacy Boundary Test',
                notes: 'Only the assigned player should read this.',
                media: [],
                sendToPlayer: false,
            },
        });
        expect(createRes.ok()).toBeTruthy();
        const created = await createRes.json();

        const unauthList = await request.get(`${baseURL}/api/player/assessments`);
        expect(unauthList.status()).toBe(401);

        const unauthSingle = await request.get(`${baseURL}/api/player/assessments?assessmentId=${created.id}`);
        expect(unauthSingle.status()).toBe(401);

        const otherToken = await getAccessToken(request, otherPlayer.email, otherPlayer.password);
        const forbiddenSingle = await request.get(`${baseURL}/api/player/assessments?assessmentId=${created.id}`, {
            headers: { Authorization: `Bearer ${otherToken}` },
        });
        expect(forbiddenSingle.status()).toBe(403);

        const otherListRes = await request.get(`${baseURL}/api/player/assessments`, {
            headers: { Authorization: `Bearer ${otherToken}` },
        });
        expect(otherListRes.ok()).toBeTruthy();
        const otherList = await otherListRes.json();
        expect(otherList.find((a: { id: string }) => a.id === created.id)).toBeFalsy();
    });

    test('API: JWT-only round trip without service role reads', async ({ request }) => {
        const coachToken = await getAccessToken(request, coach.email, coach.password);
        const title = `JWT Round Trip ${testSuffix}`;

        const createRes = await request.post(`${baseURL}/api/coach/assessments`, {
            headers: {
                Authorization: `Bearer ${coachToken}`,
                'Content-Type': 'application/json',
            },
            data: {
                playerId: player.id,
                title,
                notes: 'Created and read using player JWT only.',
                media: [],
                sendToPlayer: true,
            },
        });
        expect(createRes.ok()).toBeTruthy();
        const created = await createRes.json();

        const playerToken = await getAccessToken(request, player.email, player.password);
        const listRes = await request.get(`${baseURL}/api/player/assessments`, {
            headers: { Authorization: `Bearer ${playerToken}` },
        });
        expect(listRes.ok()).toBeTruthy();
        const list = await listRes.json();
        const listed = list.find((a: { id: string }) => a.id === created.id);
        expect(listed).toBeTruthy();
        expect(listed.title).toBe(title);

        const singleRes = await request.get(`${baseURL}/api/player/assessments?assessmentId=${created.id}`, {
            headers: { Authorization: `Bearer ${playerToken}` },
        });
        expect(singleRes.ok()).toBeTruthy();
        const single = await singleRes.json();
        expect(single.notes).toBe('Created and read using player JWT only.');
        expect(single.player_id).toBe(player.id);
    });

    test('E2E: coach sends assessment via Drill Hub UI with image upload', async ({ page }) => {
        test.setTimeout(180000);
        const title = `Drill Hub UI Send ${testSuffix}`;
        const notes = 'Full UI flow with compressed image upload.';

        await loginCoach(page, coach.email, coach.password);
        await page.getByRole('button', { name: 'Drill Hub', exact: true }).first().click();
        await page.getByRole('button', { name: /Player Assessment/i }).click();

        await page.locator('select').selectOption(player.id);
        await page.getByPlaceholder('e.g. Skating stride review').fill(title);
        await page.getByPlaceholder('Coaching feedback, strengths, areas to improve...').fill(notes);
        await page.locator('input[type="file"]').setInputFiles(fixtureImage);
        await expect(page.locator('img[alt=""]').first()).toBeVisible({ timeout: 10000 });

        const createResponse = page.waitForResponse(
            (res) => res.url().includes('/api/coach/assessments') && res.request().method() === 'POST'
        );
        await page.getByRole('button', { name: 'Send Assessment to Player' }).click();
        const response = await createResponse;
        expect(response.ok()).toBeTruthy();

        await expect(page.getByRole('button', { name: 'Send Assessment to Player' })).not.toBeVisible({ timeout: 30000 });

        await logout(page);
        await page.fill('input[type="email"]', player.email);
        await page.fill('input[type="password"]', player.password);
        await page.click('button[type="submit"]');
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });

        await page.goto(`${baseURL}/?tab=community&chatWith=${coach.id}`);
        const assessmentCard = page.locator('div.cursor-pointer')
            .filter({ hasText: 'Private Assessment' })
            .filter({ hasText: title })
            .first();
        await expect(assessmentCard).toBeVisible({ timeout: 15000 });
        await assessmentCard.click();
        await expect(page.getByText(notes)).toBeVisible();
        await expect(page.getByText('Media')).toBeVisible();
        await expect(page.locator('img[alt=""]').first()).toBeVisible({ timeout: 10000 });

        await page.goto(`${baseURL}/`);
        await expect(page.locator('[data-testid="settings-button"]').first()).toBeVisible({ timeout: 15000 });
        await page.locator('[data-testid="settings-button"]').first().click();
        await page.getByTestId('menu-item-assessments').click();
        await expect(page.getByText(title)).toBeVisible();
        await page.getByText(title).click();
        await expect(page.getByText('Coach Notes')).toBeVisible();
        await expect(page.getByText(notes)).toBeVisible();
    });

    test('Drill Hub: shows Player Assessment button and opens modal', async ({ page }) => {
        await loginCoach(page, coach.email, coach.password);

        await page.getByRole('button', { name: 'Drill Hub', exact: true }).first().click();
        await expect(page.getByRole('button', { name: /Player Assessment/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Publish Drill/i })).toBeVisible();

        await page.getByRole('button', { name: /Player Assessment/i }).click();
        await expect(page.getByText('Video Assessment')).toBeVisible();
        await expect(page.locator('select')).toBeVisible();
        await expect(page.locator('select option').first()).toHaveText('Select a player...');
        await expect(page.getByText('Private only — not saved to public drill hub')).toBeVisible();
    });

    test('Messages: coach sees assessment button in 1-on-1 player chat', async ({ page }) => {
        await loginCoach(page, coach.email, coach.password);

        await page.getByRole('button', { name: 'Messages' }).click();
        await page.getByPlaceholder('Search teams, players, or parents...').fill(player.name);
        await page.getByRole('button', { name: player.name }).click();

        const assessmentBtn = page.getByTitle('Send private assessment');
        await expect(assessmentBtn).toBeVisible();
        await assessmentBtn.click();

        await expect(page.getByText('Video Assessment')).toBeVisible();
        await expect(page.getByText(`Private • ${player.name}`)).toBeVisible();
        await expect(page.locator('select')).toHaveCount(0);
    });

    test('Schedule: no video assessment icon on attendees', async ({ page }) => {
        const sessionTitle = `Assessment Schedule Test ${testSuffix}`;
        const sessionStart = new Date(Date.now() + 3600000).toISOString();
        const sessionEnd = new Date(Date.now() + 7200000).toISOString();

        const { data: session, error: sessionError } = await supabase.from('sessions').insert({
            title: sessionTitle,
            category: 'HOCKEY',
            instructor: coach.name,
            start_time: sessionStart,
            end_time: sessionEnd,
            credit_cost: 50,
            max_capacity: 10,
        }).select().single();
        if (sessionError) throw sessionError;

        await supabase.from('registrations').insert({
            user_id: player.id,
            session_id: session.id,
        });

        await loginCoach(page, coach.email, coach.password);
        await page.getByRole('button', { name: 'Master View' }).click();

        const responsePromise = page.waitForResponse('**/api/coach/master-schedule');
        await page.locator('button svg.lucide-refresh-cw').click();
        await responsePromise;

        await page.getByText('Expand All').click();
        await expect(page.getByText(sessionTitle)).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(player.name).first()).toBeVisible();

        await expect(page.getByTitle('Private notes').first()).toBeVisible();
        await expect(page.getByTitle('Video assessment')).toHaveCount(0);
        await expect(page.getByTitle('Send private assessment')).toHaveCount(0);

        await supabase.from('registrations').delete().eq('session_id', session.id);
        await supabase.from('sessions').delete().eq('id', session.id);
    });

    test('Player: can view assessment sent via message', async ({ page }) => {
        const { data: assessment, error: assessmentError } = await supabase
            .from('player_assessments')
            .insert({
                coach_id: coach.id,
                player_id: player.id,
                title: 'Shot Release Analysis',
                notes: 'Quick release is improving.',
            })
            .select()
            .single();
        if (assessmentError) throw assessmentError;

        await supabase.from('messages').insert({
            sender_id: coach.id,
            receiver_id: player.id,
            content: 'New video assessment: Shot Release Analysis',
            shared_assessment_id: assessment!.id,
        });

        await loginPlayer(page, player.email, player.password);

        await page.goto(`${baseURL}/?tab=community&chatWith=${coach.id}`);
        const assessmentCard = page.locator('div.cursor-pointer').filter({ hasText: 'Private Assessment' }).filter({ hasText: 'Shot Release Analysis' }).first();
        await expect(assessmentCard).toBeVisible({ timeout: 15000 });
        await assessmentCard.click();
        await expect(page.getByText('Coach Notes')).toBeVisible();
        await expect(page.getByText('Quick release is improving.')).toBeVisible();
    });

    test('Player: can view assessments from Settings menu', async ({ page }) => {
        const { data: assessment, error: assessmentError } = await supabase
            .from('player_assessments')
            .insert({
                coach_id: coach.id,
                player_id: player.id,
                title: 'Edge Work Breakdown',
                notes: 'Inside edges need more depth on crossovers.',
            })
            .select()
            .single();
        if (assessmentError) throw assessmentError;

        await loginPlayer(page, player.email, player.password);

        await page.locator('[data-testid="settings-button"]').first().click();
        await expect(page.getByTestId('menu-item-assessments')).toBeVisible();
        await page.getByTestId('menu-item-assessments').click();

        await expect(page.getByText('My Assessments')).toBeVisible();
        await expect(page.getByText('Edge Work Breakdown')).toBeVisible();
        await page.getByText('Edge Work Breakdown').click();

        await expect(page.getByText('Coach Notes')).toBeVisible();
        await expect(page.getByText('Inside edges need more depth on crossovers.')).toBeVisible();
    });
});