import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * COACH WORKFLOW TESTS
 * 
 * Verifies:
 * 1. Coach can login and see dashboard.
 * 2. Coach can switch between Master View and My Schedule.
 * 3. Coach can mark an attendee as present (new feature).
 */

test.describe('Coach Workflow System', () => {
    let coachId: string;
    let coachEmail: string;
    let coachName: string = 'Test Coach';

    test.beforeEach(async () => {
        coachEmail = `coach-test-${Date.now()}@east.com`;

        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email: coachEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'coach', first_name: 'Test', last_name: 'Coach' }
        });

        if (createError) throw createError;
        coachId = userData.user.id;

        await supabase.from('profiles').upsert({
            id: coachId,
            role: 'coach',
            first_name: 'Test',
            last_name: 'Coach',
            credits: 0
        });

        // Create a test session for this coach
        // Note: The dashboard filters by coach name string currently
        await supabase.from('sessions').insert({
            title: 'Coach Test Session',
            category: 'HOCKEY',
            instructor: coachName,
            start_time: new Date(Date.now() + 3600000).toISOString(),
            end_time: new Date(Date.now() + 7200000).toISOString(),
            credit_cost: 50,
            max_capacity: 10
        });
    });

    test.afterEach(async () => {
        if (coachId) {
            await supabase.auth.admin.deleteUser(coachId);
            await supabase.from('sessions').delete().eq('instructor', coachName);
        }
    });

    test('Dashboard: My Schedule & Attendance', async ({ page }) => {
        // 1. Log in as Coach
        await page.goto('/login');
        await page.fill('input[type="email"]', coachEmail);
        await page.fill('input[type="password"]', 'TestPassword123!');
        await page.click('button[type="submit"]');

        // 2. Verify Dashboard Header
        await expect(page.locator('h1:has-text("EAST COACH")')).toBeVisible();
        await expect(page.locator(`text=${coachName}`)).toBeVisible();

        // 3. Switch to My Schedule
        await page.click('button:has-text("My Schedule")');

        // 4. Find the session (expand dates if needed)
        // Click the first date header available
        await page.click('h2.text-2xl');

        await expect(page.locator('h3:has-text("Coach Test Session")')).toBeVisible();

        // 5. Simulate an attendee (backend injection for testing)
        // Actually, let's just check that the attendance toggle logic works visually
        // We'll insert a registration for this session
        const { data: session } = await supabase.from('sessions').select('id').eq('instructor', coachName).single();
        if (session) {
            await supabase.from('registrations').insert({
                user_id: coachId, // Use coach as attendee for testing simplicity
                session_id: session.id
            });

            await page.reload();
            await page.click('h2.text-2xl');

            // 6. Mark as Present
            await page.click(`text=Test Coach`); // The attendee name in the list
            await expect(page.locator('span:has-text("Present")')).toBeVisible();
        }
    });
});
