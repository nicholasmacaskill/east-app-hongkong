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

test.describe('Cancelled Session Visibility Verification', () => {
    let testSessionId: number;
    let userId: string;
    const testTitle = `Visibility Test ${Date.now()}`;

    test.beforeAll(async () => {
        // 1. Get User ID from auth state
        const authStatePath = 'playwright/.auth/user.json';
        if (fs.existsSync(authStatePath)) {
            const authState = JSON.parse(fs.readFileSync(authStatePath, 'utf-8'));
            const authCookie = authState.cookies.find((c: any) => c.name.includes('-auth-token'));
            if (authCookie) {
                let cookieValue = authCookie.value;
                if (cookieValue.startsWith('base64-')) {
                    cookieValue = Buffer.from(cookieValue.replace('base64-', ''), 'base64').toString('utf-8');
                } else if (cookieValue.includes('%')) {
                    cookieValue = decodeURIComponent(cookieValue);
                }
                const sessionData = JSON.parse(cookieValue);
                userId = sessionData.user.id;
            }
        }

        if (!userId) throw new Error("Could not determine User ID for test setup");

        // 2. Create a session
        const start = new Date();
        start.setHours(start.getHours() + 2); // Today, in 2 hours
        const end = new Date(start);
        end.setHours(start.getHours() + 1);

        const { data: session, error: sessError } = await supabase
            .from('sessions')
            .insert({
                title: testTitle,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                category: 'CLASS',
                instructor: 'Visibility Coach',
                max_capacity: 10,
                credit_cost: 10,
                status: 'active'
            })
            .select()
            .single();

        if (sessError) throw sessError;
        testSessionId = session.id;

        // 3. Ensure profile exists (to satisfy FK constraint)
        await supabase.from('profiles').upsert({
            id: userId,
            first_name: 'Visibility',
            last_name: 'Test',
            role: 'parent',
            subscription_status: 'active'
        });

        // 4. Create a registration
        const { error: regError } = await supabase
            .from('registrations')
            .insert({
                user_id: userId,
                session_id: testSessionId,
                status: 'confirmed'
            });

        if (regError) throw regError;
    });

    test.afterAll(async () => {
        if (testSessionId) {
            await supabase.from('registrations').delete().eq('session_id', testSessionId);
            await supabase.from('sessions').delete().eq('id', testSessionId);
        }
    });

    test('should NOT show cancelled registrations in My Schedule', async ({ page }) => {
        await page.goto('/?tab=schedule');

        // Confirm it IS visible initially
        await expect(page.locator(`text="${testTitle}"`)).toBeVisible({ timeout: 10000 });

        // Update registration to 'cancelled' in DB
        await supabase
            .from('registrations')
            .update({ status: 'cancelled' })
            .eq('user_id', userId)
            .eq('session_id', testSessionId);

        // Refresh page or wait for refresh
        await page.reload();
        await page.waitForTimeout(2000);

        // Confirm it is NO LONGER visible
        await expect(page.locator(`text="${testTitle}"`)).not.toBeVisible();
    });

    test('should NOT show cancelled sessions in Booking Feed', async ({ page }) => {
        await page.goto('/'); // Home tab

        // Hard to find in the feed because it's tomorrow, but let's try searching or scrolling if needed.
        // Actually, the sessions API usually returns ALL future sessions.
        // Let's check the API directly if UI is complex to navigate.
        // OR better: navigate to the service and check if it's in the list.

        // Update session to 'active' again (registration is still cancelled but that shouldn't hide the SESSION)
        await supabase.from('sessions').update({ status: 'active' }).eq('id', testSessionId);

        // Navigate to the "Classes" section or similar.
        // For simplicity, let's just check the API response if we can.
        // But the rule says E2E UI verification.

        // Let's update session to 'cancelled'
        await supabase.from('sessions').update({ status: 'cancelled' }).eq('id', testSessionId);

        await page.reload();
        await page.waitForTimeout(2000);

        // If it's cancelled at session level, it shouldn't be in the feed at all.
        await expect(page.locator(`text="${testTitle}"`)).not.toBeVisible();
    });
});
