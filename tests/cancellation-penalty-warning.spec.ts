import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Cancellation Penalty Warning', () => {
    let testServiceId: string;
    let parentId: string;

    // Helper to create a session at a specific offset (hours from now)
    async function createSessionAtOffset(hours: number, titleSuffix: string) {
        const startTime = new Date();
        startTime.setTime(startTime.getTime() + (hours * 60 * 60 * 1000));

        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1);

        const { data: session, error } = await supabase
            .from('sessions')
            .insert({
                title: `Penalty Test ${titleSuffix} ${Date.now()}`,
                description: 'E2E Penalty Test',
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                category: 'CLASS',
                session_type_id: testServiceId,
                instructor: 'Coach Penalty',
                total_facility_bays: 1,
                max_capacity: 5,
                credit_cost: 20 // Using 20 to easily test 50% (10)
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create session: ${error.message}`);
        return session;
    }

    test.beforeAll(async () => {
        // 1. Create a Test Service
        const { data: service, error: svcError } = await supabase
            .from('session_types')
            .insert({
                title: 'Penalty Modal Test',
                category: 'CLASS',
                description: 'E2E Penalty Test Service',
                image_url: 'https://placehold.co/400'
            })
            .select()
            .single();

        if (svcError) throw new Error(`Setup Failed (Service): ${svcError.message}`);
        testServiceId = service.id;
    });

    test.afterAll(async () => {
        // Cleanup Service (Sessions naturally cascade or we can leave them for manual inspection if needed, but best to clean)
        // Note: Individual sessions are cleaned up or left as debris. ideally clean.
        if (testServiceId) {
            // Delete sessions first to be safe if cascade isn't set (it is usually)
            await supabase.from('sessions').delete().eq('session_type_id', testServiceId);
            await supabase.from('session_types').delete().eq('id', testServiceId);
        }
    });

    test.beforeEach(async () => {
        // Setup User ID from auth state
        try {
            const authStatePath = 'playwright/.auth/user.json';
            const authState = JSON.parse(fs.readFileSync(authStatePath, 'utf-8'));
            const authCookie = authState.cookies.find((c: any) => c.name.includes('-auth-token'));
            if (!authCookie) throw new Error("Supabase auth cookie not found");

            let cookieValue = authCookie.value;
            if (cookieValue.startsWith('base64-')) {
                cookieValue = Buffer.from(cookieValue.replace('base64-', ''), 'base64').toString('utf-8');
            } else if (cookieValue.includes('%')) {
                cookieValue = decodeURIComponent(cookieValue);
            }
            const sessionData = JSON.parse(cookieValue);
            parentId = sessionData.user.id;

            // Ensure ample credits
            await supabase.from('profiles').update({ credits: 1000 }).eq('id', parentId);

        } catch (e: any) {
            console.error('[SETUP ERROR]', e);
            throw e;
        }
    });

    // Helper to book session
    async function bookSession(sessionId: number) {
        // Clean existing
        await supabase.from('registrations').delete().eq('user_id', parentId).eq('session_id', sessionId);

        const { error } = await supabase.from('registrations').insert({
            user_id: parentId,
            session_id: sessionId,
            payer_id: parentId,
            credits_paid: 20 // Important for refund calc
        });
        if (error) throw new Error(`Booking failed: ${error.message}`);
    }

    test('Warning < 24h: Should show 0% refund warning', async ({ page }) => {
        // 1. Create Session starting in 6 hours
        const session = await createSessionAtOffset(6, 'Late');
        await bookSession(session.id);

        // 2. Go to Schedule
        await page.goto('/?tab=schedule');
        const sessionCard = page.locator(`text="${session.title}"`).first();
        await expect(sessionCard).toBeVisible({ timeout: 10000 });
        await sessionCard.click();

        // 3. Click Cancel
        await page.click('button:has-text("CANCEL SELECTION")');

        // 4. Verify Warning Modal
        const modal = page.locator('div[role="dialog"]'); // Assuming modal role or check content
        await expect(page.locator('text="Cancellation Policy"')).toBeVisible();
        await expect(page.locator('text="NOT receive a refund"')).toBeVisible(); // Key phrase
        // 0 credits
        await expect(page.locator('text="0 credits"')).toBeVisible(); // Roughly expecting this text

        // 5. Cancel out
        await page.click('button:has-text("Nevermind")');
        await expect(page.locator('text="Cancellation Policy"')).not.toBeVisible();
    });

    test('Warning 24-48h: Should show 50% refund warning', async ({ page }) => {
        // 1. Create Session starting in 30 hours
        const session = await createSessionAtOffset(30, 'Medium');
        await bookSession(session.id);

        // 2. Go to Schedule
        await page.goto('/?tab=schedule');
        const sessionCard = page.locator(`text="${session.title}"`).first();
        await expect(sessionCard).toBeVisible({ timeout: 10000 });
        await sessionCard.click();

        // 3. Click Cancel
        await page.click('button:has-text("CANCEL SELECTION")');

        // 4. Verify Warning Modal
        await expect(page.locator('text="Cancellation Policy"')).toBeVisible();
        await expect(page.locator('text="50% refund"')).toBeVisible();
        // 10 credits (50% of 20)
        await expect(page.locator('text="10 credits"')).toBeVisible();

        // 5. Confirm Cancel
        await page.click('button:has-text("Yes, Cancel Session")');

        // 6. Verify processed
        await expect(page.locator(`text="${session.title}"`)).not.toBeVisible();
    });

    test('Warning > 48h: Should show 100% refund warning', async ({ page }) => {
        // 1. Create Session starting in 72 hours
        const session = await createSessionAtOffset(72, 'Early');
        await bookSession(session.id);

        // 2. Go to Schedule
        await page.goto('/?tab=schedule');
        const sessionCard = page.locator(`text="${session.title}"`).first();
        await expect(sessionCard).toBeVisible({ timeout: 10000 });
        await sessionCard.click();

        // 3. Click Cancel
        await page.click('button:has-text("CANCEL SELECTION")');

        // 4. Verify Warning Modal
        await expect(page.locator('text="Cancellation Policy"')).toBeVisible();
        await expect(page.locator('text="full refund"')).toBeVisible();
        await expect(page.locator('text="20 credits"')).toBeVisible(); // Full amount

        // 5. Confirm Cancel
        await page.click('button:has-text("Yes, Cancel Session")');

        // 6. Verify processed
        await expect(page.locator(`text="${session.title}"`)).not.toBeVisible();
    });
});
