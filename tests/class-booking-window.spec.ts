import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Full Month (30-Day) Class Booking Window Flow', () => {
    const timestamp = Date.now();
    const testTitle = `30Day Advance Class Test ${timestamp}`;
    let testServiceId: string;
    let testSessionId: number;

    test.beforeAll(async () => {
        // 1. Create a Test Service (Class Type)
        const { data: service, error: svcError } = await supabase
            .from('session_types')
            .insert({
                title: testTitle,
                category: 'CLASS',
                description: 'Testing 30-day booking window',
                image_url: 'https://placehold.co/400'
            })
            .select()
            .single();

        if (svcError) throw new Error(`Setup Failed (Service): ${svcError.message}`);
        testServiceId = service.id;

        // 2. Create a Session 21 Days (3 Weeks) in the Future
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 21);
        futureDate.setHours(14, 0, 0, 0);

        const endTime = new Date(futureDate);
        endTime.setHours(futureDate.getHours() + 1);

        const { data: session, error: sessError } = await supabase
            .from('sessions')
            .insert({
                title: testTitle,
                description: 'E2E Test Session 3 Weeks Out',
                start_time: futureDate.toISOString(),
                end_time: endTime.toISOString(),
                category: 'CLASS',
                session_type_id: testServiceId,
                instructor: 'Coach Future',
                total_facility_bays: 1,
                max_capacity: 8,
                credit_cost: 5
            })
            .select()
            .single();

        if (sessError) throw new Error(`Setup Failed (Session): ${sessError.message}`);
        testSessionId = session.id;
    });

    test.afterAll(async () => {
        // Cleanup test data
        if (testSessionId) {
            await supabase.from('registrations').delete().eq('session_id', testSessionId);
            await supabase.from('sessions').delete().eq('id', testSessionId);
        }
        if (testServiceId) {
            await supabase.from('session_types').delete().eq('id', testServiceId);
        }
    });

    test('should return session 21 days out in /api/sessions and allow user booking', async ({ page, request }) => {
        // 1. Backend Verification: /api/sessions must return the session 21 days ahead
        const apiRes = await request.get('/api/sessions');
        expect(apiRes.ok()).toBeTruthy();
        const sessions = await apiRes.json();
        const found = sessions.some((s: any) => s.id === testSessionId);
        expect(found).toBe(true);

        // 2. UI Verification: Visit app and open modal
        page.on('console', msg => {
            if (msg.type() === 'error') console.log(`[BROWSER ERROR]: ${msg.text()}`);
        });

        page.on('dialog', async dialog => {
            await dialog.dismiss();
        });

        await page.goto('/');
        await expect(page.locator('h2:has-text("Breaking News")')).toBeVisible();

        // 3. Find and click the service card
        const serviceCard = page.locator(`text=${testTitle}`).first();
        await expect(serviceCard).toBeVisible();
        await serviceCard.click();

        // 4. Verify Class Modal opens
        await expect(page.locator('h2', { hasText: new RegExp(testTitle, 'i') }).first()).toBeVisible();

        // 5. Select the session button in the modal
        const sessionButton = page.locator('button', { hasText: /5 Credits/i }).first();
        await expect(sessionButton).toBeVisible();
        await sessionButton.click();

        // 6. Complete booking
        const payButton = page.locator('button:has-text("PAY 5 CREDITS")');
        await expect(payButton).toBeVisible({ timeout: 5000 });
        await payButton.click();

        // Wait for booking confirmation and modal close
        await page.waitForTimeout(3000);

        // 7. DB Verification: Registration record created
        const { count, error } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', testSessionId);

        if (error) console.error('[DEBUG] DB Check Error:', error);
        expect(count).toBeGreaterThan(0);

        // 8. Verify modal closes
        await expect(page.locator('h2', { hasText: new RegExp(testTitle, 'i') })).not.toBeVisible();
    });
});
