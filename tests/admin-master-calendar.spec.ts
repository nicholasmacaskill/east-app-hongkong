import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Master Calendar Integration', () => {
    let testSessionId: number;
    let testUserId: string;

    test.beforeAll(async () => {
        // 1. Create a dummy user profile if needed, or pick an existing one
        // For simplicity, we'll assume we can use the admin/test user, 
        // but let's try to query an existing user to "book" them.
        const { data: users } = await supabase.from('profiles').select('id, first_name, last_name, role').limit(1);
        if (!users || users.length === 0) throw new Error("No users found to test booking");
        testUserId = users[0].id;
        console.log(`Using user ${testUserId} (${users[0].first_name}) for testing`);
    });

    test.afterAll(async () => {
        // Cleanup
        if (testSessionId) {
            await supabase.from('registrations').delete().eq('session_id', testSessionId);
            await supabase.from('sessions').delete().eq('id', testSessionId);
        }
    });

    test('should display booked user name on master calendar session card', async ({ page }) => {
        // 1. Create a session via DB to ensure we have a controlled test case
        const startTime = new Date();
        startTime.setHours(startTime.getHours() + 1);
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1);

        const { data: session, error } = await supabase.from('sessions').insert({
            title: 'Auto-Test Session',
            category: 'PRIVATE',
            instructor: 'Test Coach',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            total_facility_bays: 0,
            max_capacity: 1,
            credit_cost: 100
        }).select().single();

        if (error || !session) throw new Error(`Failed to create test session: ${error?.message}`);
        testSessionId = session.id;

        // 2. Register the user to this session
        const { error: regError } = await supabase.from('registrations').insert({
            user_id: testUserId,
            session_id: testSessionId,
            status: 'confirmed'
        });

        if (regError) throw new Error(`Failed to register user: ${regError.message}`);

        // 3. Login as Admin and Navigate to Master Schedule
        // NOTE: Standard admin tests usually have auth setup or use global setup. 
        // Assuming we need to login or use a project that saves storage state.
        // For this specific test pattern seen in admin-service-cost.spec.ts, it seems to assume authenticated state or handles it.
        // If not, we might fail on auth. Let's try navigating directly, assuming --project=admin-chromium has state.

        await page.goto('/sys-admin/schedule');

        // Wait for initial load to complete
        await expect(page.locator('text=Syncing Schedule...')).not.toBeVisible({ timeout: 10000 });

        // Robustness: Data creation might be for tomorrow/today, but UI might default to slightly different week depending on timezone.
        // We try to find the session. If not found, we try clicking "Next Week" once.
        const sessionSelector = `div:has-text("Auto-Test Session")`;
        let found = false;

        for (let i = 0; i < 4; i++) {
            try {
                // Check if we are loading
                await expect(page.locator('text=Syncing Schedule...')).not.toBeVisible({ timeout: 5000 });

                const sessionCard = page.locator(sessionSelector).last();
                if (await sessionCard.isVisible()) {
                    found = true;
                    break;
                }
                throw new Error("Not found");
            } catch (e) {
                console.log(`Session not found in current view, clicking Next Week (attempt ${i + 1})...`);
                // Click next week button (right chevron)
                try {
                    await page.locator('button:has(svg.lucide-chevron-right)').first().click();
                    await page.waitForTimeout(1000); // Allow fetch trigger
                } catch (clickError) {
                    console.log("Could not click next week button");
                }
            }
        }

        expect(found, "Could not find Auto-Test Session after checking multiple weeks").toBe(true);

        const sessionCard = page.locator(sessionSelector).last();
        // Check if the user's name is visible within that card
        const { data: user } = await supabase.from('profiles').select('first_name, last_name').eq('id', testUserId).single();

        // The UI displays "Booked by: [Name]"
        await expect(sessionCard).toContainText(`Booked by: ${user?.first_name}`);
    });
});
