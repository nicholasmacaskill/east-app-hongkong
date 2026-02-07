import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('Admin Booking Logs & Coach Visibility Verification', () => {
    let testSessionId: number;
    let userId: string; // The player
    let adminId: string; // The currently logged in admin
    const testTitle = `Booking Log Test ${Date.now()}`;

    test.beforeAll(async () => {
        // 1. Get a test player
        const { data: profiles } = await supabase.from('profiles').select('id, role').eq('role', 'player').limit(1);
        if (!profiles || profiles.length === 0) throw new Error("No player found for testing");
        userId = profiles[0].id;

        // 2. Get Admin ID from auth state
        const adminAuthPath = 'playwright/.auth/admin.json';
        if (fs.existsSync(adminAuthPath)) {
            const authState = JSON.parse(fs.readFileSync(adminAuthPath, 'utf-8'));
            const authCookie = authState.cookies.find((c: any) => c.name.includes('-auth-token'));
            if (authCookie) {
                let cookieValue = authCookie.value;
                if (cookieValue.startsWith('base64-')) {
                    cookieValue = Buffer.from(cookieValue.replace('base64-', ''), 'base64').toString('utf-8');
                } else if (cookieValue.includes('%')) {
                    cookieValue = decodeURIComponent(cookieValue);
                }
                const sessionData = JSON.parse(cookieValue);
                adminId = sessionData.user.id;
            }
        }
        if (!adminId) throw new Error("Could not determine Admin ID for test setup");

        // 3. Create a session
        const start = new Date();
        start.setHours(start.getHours() + 24); // Tomorrow
        const end = new Date(start);
        end.setHours(start.getHours() + 1);

        const { data: session, error: sessError } = await supabase
            .from('sessions')
            .insert({
                title: testTitle,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                category: 'CLASS',
                instructor: 'Log Test Coach',
                max_capacity: 10,
                credit_cost: 10,
                status: 'active'
            })
            .select()
            .single();

        if (sessError) throw sessError;
        testSessionId = session.id;

        // 4. Perform a manual booking
        await supabase
            .from('registrations')
            .insert({
                user_id: userId,
                session_id: testSessionId,
                status: 'confirmed'
            });

        await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                amount: -10,
                type: 'booking',
                session_id: testSessionId,
                description: `Manual test booking for ${testTitle}`
            });
    });

    test.afterAll(async () => {
        if (testSessionId) {
            await supabase.from('transactions').delete().eq('session_id', testSessionId);
            await supabase.from('registrations').delete().eq('session_id', testSessionId);
            await supabase.from('sessions').delete().eq('id', testSessionId);
        }
        // Ensure admin is back to sys-admin
        if (adminId) {
            await supabase.from('profiles').update({ role: 'sys-admin' }).eq('id', adminId);
        }
    });

    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Booking Log Page should display the new booking', async ({ page }) => {
        await page.goto('/sys-admin/bookings');
        await page.waitForLoadState('networkidle');

        await expect(page.locator(`text="${testTitle}"`).first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator('td:has-text("BOOKING")').first()).toBeVisible();
    });

    test('Coach Dashboard and Admin Schedule should show cancelled items', async ({ page }) => {
        // 1. Promote Admin to Coach for Dashboard test
        await supabase.from('profiles').update({ role: 'coach' }).eq('id', adminId);
        await new Promise(r => setTimeout(r, 1000)); // Gap for DB consistency

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // If still showing Admin Portal, wait and reload
        const adminPortal = page.locator('text="Admin Access"');
        if (await adminPortal.isVisible()) {
            await page.waitForTimeout(2000);
            await page.reload();
        }

        // Verify session is visible on Coach Dashboard
        // Find the date header for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        // Expand the date section if not already visible
        const dateBtn = page.locator(`button:has-text("${dateStr}")`).first();
        await dateBtn.click();

        await expect(page.locator(`text="${testTitle}"`).first()).toBeVisible({ timeout: 15000 });

        // 2. Cancel the session
        await supabase.from('sessions').update({ status: 'cancelled' }).eq('id', testSessionId);
        await supabase.from('registrations').update({ status: 'cancelled' }).eq('session_id', testSessionId);
        await supabase.from('transactions').insert({
            user_id: userId,
            amount: 10,
            type: 'refund',
            session_id: testSessionId,
            description: `Manual test refund for ${testTitle}`
        });

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Expand again after reload
        await page.locator(`button:has-text("${dateStr}")`).first().click();

        // Verify "CANCELLED" stamp/badge on Coach Dashboard
        const sessionCard = page.locator(`div:has-text("${testTitle}")`).first();
        await expect(sessionCard).toBeVisible();
        await expect(sessionCard.locator('text="CANCELLED"').first()).toBeVisible();

        // 3. Verify in Admin Schedule modal
        // Revert role to sys-admin
        await supabase.from('profiles').update({ role: 'sys-admin' }).eq('id', adminId);
        await page.goto('/sys-admin/schedule');
        await page.waitForLoadState('networkidle');

        // Search and Open modal
        await page.locator('input[placeholder="Search sessions..."]').fill(testTitle);
        const adminCard = page.locator('div:has-text("' + testTitle + '")').first();
        await expect(adminCard).toBeVisible({ timeout: 10000 });
        await adminCard.click();

        // Verify cancelled registration is visible in modal
        // Get player name for assertion
        const { data: player } = await supabase.from('profiles').select('first_name, last_name').eq('id', userId).single();
        if (!player) throw new Error("Player profile not found in DB");
        const fullPlayerName = `${player.first_name} ${player.last_name}`;
        await expect(page.locator(`text="${fullPlayerName}"`)).toBeVisible({ timeout: 15000 });
        await expect(page.locator('text="cancelled"').last()).toBeVisible(); // The status badge in the modal table
    });
});
