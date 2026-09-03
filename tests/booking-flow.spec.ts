import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('User Booking Flow', () => {
    let testSessionId: number | null = null;
    let testServiceId: string | null = null;

    test.beforeAll(async () => {
        // 1. Create a Test Service (Class Type)
        const { data: service, error: svcError } = await supabase
            .from('session_types')
            .insert({
                title: 'Automated Booking Test',
                category: 'CLASS',
                description: 'E2E Test Description',
                image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600'
            })
            .select()
            .single();

        if (svcError) throw new Error(`Setup Failed (Service): ${svcError.message}`);
        testServiceId = service.id;

        // 2. Create a Future Session for this Service
        const today = new Date();
        // Set to 2 hours from now to ensure it's in the future (and 'today')
        today.setHours(today.getHours() + 2);
        today.setMinutes(0, 0, 0); // Cleaner time

        const endTime = new Date(today);
        endTime.setHours(today.getHours() + 1);

        const { data: session, error: sessError } = await supabase
            .from('sessions')
            .insert({
                title: 'Automated Booking Test', // Unified Title
                description: 'E2E Test Session',
                start_time: today.toISOString(),
                end_time: endTime.toISOString(),
                category: 'CLASS',
                session_type_id: testServiceId,
                instructor: 'Coach Auto',
                total_facility_bays: 1,
                max_capacity: 5,
                credit_cost: 5
            })
            .select()
            .single();

        if (sessError) throw new Error(`Setup Failed (Session): ${sessError.message}`);
        testSessionId = session.id;
    });

    test.afterAll(async () => {
        // Cleanup Session and Registrations
        if (testSessionId) {
            await supabase.from('registrations').delete().eq('session_id', testSessionId);
            await supabase.from('sessions').delete().eq('id', testSessionId);
        }
        if (testServiceId) {
            await supabase.from('session_types').delete().eq('id', testServiceId);
        }
    });

    test('should allow parent to book a class', async ({ page }) => {
        // 1. Visit Home
        await page.goto('/');

        // 2. Locate the Service in the UI
        page.on('dialog', async dialog => {
            console.log(`[Dialog]: ${dialog.message()}`);
            await dialog.dismiss();
        });

        // We look for the text of the service title
        const serviceCard = page.locator(`text=Automated Booking Test`).first();
        await expect(serviceCard).toBeVisible({ timeout: 15000 });
        await serviceCard.click();

        // 3. Class Modal should open
        await page.waitForTimeout(1000);

        // It should auto-select the single session (modal header check)
        await expect(page.locator('h2', { hasText: /Automated Booking Test/i }).first()).toBeVisible({ timeout: 10000 });

        // 4. If session time slot selection button is present, click it
        const sessionButton = page.locator('button', { hasText: /5 Credits/i }).first();
        if (await sessionButton.isVisible()) {
            await sessionButton.click();
        }

        // 5. Select "Myself" (Parent) / Pay Button
        const payBtn = page.locator('button:has-text("PAY 5 CREDITS")');
        await expect(payBtn).toBeVisible({ timeout: 5000 });
        await payBtn.click();

        // Wait for processing
        await page.waitForTimeout(3000);

        // 6. DB Verification
        const { count, error } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', testSessionId);

        if (error) console.error('[DEBUG] DB Check Error:', error);

        if (count === 0) {
            throw new Error("Booking failed - No registration found in DB.");
        }

        // 7. Verify UI Update
        await expect(page.locator('h2', { hasText: /Automated Booking Test/i })).not.toBeVisible();

        // 8. Go to Schedule to verify appearance
        await page.click('button:has-text("Schedule")');

        // 9. Verify Session in Schedule
        await expect(page.locator('text=Automated Booking Test').first()).toBeVisible({ timeout: 15000 });
    });
});
