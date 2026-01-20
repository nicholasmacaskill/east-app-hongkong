import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe.configure({ mode: 'serial' });

test.describe('Coach Extended Functionality', () => {
    let coachId: string;
    let playerId: string;
    let sessionId: number;
    const coachEmail = `coach-ext-${Date.now()}@east.com`;
    const playerEmail = `player-ext-${Date.now()}@east.com`;
    const coachPassword = 'TestPassword123!';
    const sessionTitle = `Extended Test Session ${Date.now()}`;

    test.beforeAll(async () => {
        // 1. Create Coach
        const { data: coachData, error: coachError } = await supabase.auth.admin.createUser({
            email: coachEmail,
            password: coachPassword,
            email_confirm: true,
            user_metadata: { role: 'coach', first_name: 'Extended', last_name: 'Coach' }
        });
        if (coachError) throw coachError;
        coachId = coachData.user.id;
        await supabase.from('profiles').upsert({ id: coachId, role: 'coach', first_name: 'Extended', last_name: 'Coach' });

        // 2. Create Player
        const { data: playerData, error: playerError } = await supabase.auth.admin.createUser({
            email: playerEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'Roster', last_name: 'Player' }
        });
        if (playerError) throw playerError;
        playerId = playerData.user.id;
        await supabase.from('profiles').upsert({ id: playerId, role: 'player', first_name: 'Roster', last_name: 'Player' });

        // 3. Create Session (instructor matches coach name for filtering)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 2);
        futureDate.setHours(14, 0, 0, 0); // 2 PM
        const start = futureDate.toISOString();
        const end = new Date(futureDate.getTime() + 3600000).toISOString(); // 3 PM

        const { data: sessData, error: sessError } = await supabase.from('sessions').insert({
            title: sessionTitle,
            category: 'HOCKEY',
            instructor: 'Extended Coach',
            start_time: start,
            end_time: end,
            credit_cost: 0,
            max_capacity: 10
        }).select().single();
        if (sessError) throw sessError;
        sessionId = sessData.id;

        // 4. Register Player
        await supabase.from('registrations').insert({
            user_id: playerId,
            session_id: sessionId
        });
    });

    test.afterAll(async () => {
        if (coachId) await supabase.auth.admin.deleteUser(coachId);
        if (playerId) await supabase.auth.admin.deleteUser(playerId);
        // Cascade deletes handle the rest
    });

    test('Full Coach Extended Flow: Profile & Roster Notes', async ({ page }) => {
        // 1. LOGIN
        await page.goto('/login');
        await page.fill('input[type="email"]', coachEmail);
        await page.fill('input[type="password"]', coachPassword);
        await page.click('button[type="submit"]');

        // 2. PROFILE CUSTOMIZATION
        await page.click('button:has-text("Profile")');
        await expect(page.locator('h1:has-text(" Extended ")').or(page.locator('h2:has-text(" Extended ")'))).toBeVisible();

        // Open Settings Modal
        await page.locator('button.right-6.top-4').first().click();

        // Enter Edit Mode
        await page.click('text=Personal Details');

        // Update Bio
        const newBio = 'Veteran hockey coach specializing in power skating and edge work. Verified by Playwright.';
        await page.fill('textarea[placeholder*="bio"]', newBio);
        await page.click('button:has-text("Save Changes")');

        // Verify bio updated in Coach Profile
        await expect(page.locator(`text="${newBio}"`)).toBeVisible({ timeout: 10000 });

        // 3. ROSTER & NOTES
        // Return to Home (Coach Dashboard)
        await page.click('button:has-text("Home")');

        // Ensure we are in Master View to see all sessions
        await page.click('button:has-text("Master View")');

        // Refresh and wait for data (using the refresh icon)
        const responsePromise = page.waitForResponse('**/api/coach/master-schedule');
        await page.locator('button svg.lucide-refresh-cw').click();
        await responsePromise;

        // Expand All sections to reveal attendees
        await page.click('text=Expand All');

        // Verify session title first
        await expect(page.locator(`text=${sessionTitle}`)).toBeVisible({ timeout: 15000 });

        // Verify attendee 'Roster Player' is present
        await expect(page.locator('text=Roster Player').first()).toBeVisible();

        // Open Note Modal
        await page.locator('button[title="Private Note"]').first().click();
        await expect(page.locator('h2:has-text("PLAYER NOTES")')).toBeVisible();

        // Add a Note
        const testNote = `Verified athlete performance at ${new Date().toISOString()}`;
        await page.fill('textarea[placeholder*="feedback"]', testNote);
        await page.click('button:has(svg.lucide-send)');

        // Wait for note to appear in history
        await expect(page.locator(`text="${testNote}"`)).toBeVisible();

        // Close and re-open to verify persistence
        await page.click('button:has(svg.lucide-x)');
        await page.locator('button[title="Private Note"]').first().click();
        await expect(page.locator(`text="${testNote}"`)).toBeVisible();
    });
});
