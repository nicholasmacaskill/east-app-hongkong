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
    let testServiceId: string;
    let testSessionId: number;

    test.beforeAll(async () => {
        // 1. Create a Test Service (Class Type)
        const { data: service, error: svcError } = await supabase
            .from('session_types')
            .insert({
                title: 'Automated Booking Test', // Unified Title
                category: 'CLASS',
                description: 'E2E Test Service',
                image_url: 'https://placehold.co/400'
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
        // Cleanup
        if (testSessionId) await supabase.from('sessions').delete().eq('id', testSessionId);
        if (testServiceId) await supabase.from('session_types').delete().eq('id', testServiceId);
    });

    test('should allow parent to book a class', async ({ page }) => {
        // Monitor Console for critical errors
        page.on('console', msg => {
            if (msg.type() === 'error') console.log(`[BROWSER ERROR]: ${msg.text()}`);
        });

        // 1. Login (using existing auth setup)
        await page.goto('/');

        // Wait for Home Screen
        await expect(page.locator('h2:has-text("Breaking News")')).toBeVisible();

        // 2. Find the Service in "Classes" section

        // Setup Dialog Listener (Auto-Dismiss Success)
        page.on('dialog', async dialog => {
            console.log(`[Dialog]: ${dialog.message()}`);
            await dialog.dismiss();
        });

        // We look for the text of the service title
        const serviceCard = page.locator(`text=Automated Booking Test`).first();
        await expect(serviceCard).toBeVisible();
        await serviceCard.click();

        // 3. Class Modal should open
        // Wait a bit
        await page.waitForTimeout(1000);

        // It should auto-select the single session (modal header check)
        // Use .first() as header appears in multiple places in DOM
        await expect(page.locator('h2', { hasText: /Automated Booking Test/i }).first()).toBeVisible();

        // 4. Select "Myself" (Parent)
        await expect(page.locator('button:has-text("PAY 5 CREDITS")')).toBeVisible();

        // 5. Click Pay
        await page.click('button:has-text("PAY 5 CREDITS")');

        // Wait a bit for processing
        await page.waitForTimeout(3000);

        // 6. DB Verification
        // Check if registration exists
        const { count, error } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', testSessionId);

        if (error) console.error('[DEBUG] DB Check Error:', error);

        if (count === 0) {
            throw new Error("Booking failed - No registration found in DB.");
        }

        // 7. Verify UI Update (Button should change to "BOOKED" or disappear?)
        // The modal closes on success, so the header should not be visible
        await expect(page.locator('h2', { hasText: /Automated Booking Test/i })).not.toBeVisible();

        // 8. Go to Schedule to verify appearance
        await page.click('button:has-text("Schedule")'); // Bottom Nav

        // 9. Verify Session in Schedule (Since we used 'Today', it should appear immediately)
        await expect(page.getByText(/Automated Booking Test/i)).toBeVisible();
    });
});
