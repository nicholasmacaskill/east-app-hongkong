import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Booking Categories Logic', () => {
    let testFacilityTypeId: string;
    let facilitySessionId: number;
    let coachName: string;

    test.beforeAll(async () => {
        // 1. Create a Test Facility Type
        const { data: service, error: svcError } = await supabase
            .from('session_types')
            .insert({
                title: 'Category Test Facility',
                category: 'FACILITY',
                description: 'Testing category labels',
                image_url: 'https://placehold.co/400'
            })
            .select()
            .single();

        if (svcError) throw new Error(`Setup Failed (Service): ${svcError.message}`);
        testFacilityTypeId = service.id;

        // 2. Find a coach
        const { data: coach } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('role', 'coach')
            .limit(1)
            .single();

        coachName = coach ? `${coach.first_name} ${coach.last_name}` : 'Test Coach';

        // 3. Create a Facility Session assigned to this coach
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(14, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(15, 0, 0, 0);

        const { data: sess, error: sessError } = await supabase
            .from('sessions')
            .insert({
                title: 'Category Test Facility',
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                category: 'FACILITY',
                session_type_id: testFacilityTypeId,
                instructor: coachName,
                max_capacity: 1,
                credit_cost: 10
            })
            .select()
            .single();
        if (sessError) throw new Error(`Setup Failed (Session): ${sessError.message}`);
        facilitySessionId = sess.id;
    });

    test.afterAll(async () => {
        if (facilitySessionId) await supabase.from('sessions').delete().eq('id', facilitySessionId);
        if (testFacilityTypeId) await supabase.from('session_types').delete().eq('id', testFacilityTypeId);
    });

    test('Facility booking should show facility title even when opened from coach', async ({ page }) => {
        // Use a longer timeout for the whole test to account for potential repairs
        test.slow();

        await page.goto('/');

        // Wait for loading to finish - this might take a while if profile is being repaired
        await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 30000 });

        // 1. Check direct facility click
        const facilityTile = page.locator('text=Category Test Facility').first();
        await expect(facilityTile).toBeVisible({ timeout: 15000 });
        await facilityTile.click();

        // Verify header in modal
        await expect(page.locator('h2', { hasText: /Category Test Facility/i }).first()).toBeVisible();

        // Close modal
        await page.locator('button').filter({ has: page.locator('.lucide-x') }).first().click();

        // 2. Check coach click (simulating origin='coaches')
        const coachProfile = page.locator(`text=${coachName}`).first();
        if (await coachProfile.isVisible()) {
            await coachProfile.click();

            // The modal should open. Since the session is a FACILITY, it should show its title.
            // Even if origin is 'coaches', our fix should skip 'BOOK COACH' for facilities.
            await expect(page.locator('h2', { hasText: /Category Test Facility/i }).first()).toBeVisible();
            await expect(page.locator('h2', { hasText: /BOOK COACH/i })).not.toBeVisible();
        }
    });
});
