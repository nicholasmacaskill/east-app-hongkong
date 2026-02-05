import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Booking Window Restriction (7 Days)', () => {
    let testServiceId: string;
    let nearSessionId: number;
    let farSessionId: number;

    test.beforeAll(async () => {
        // 1. Create a Test Service
        const { data: service, error: svcError } = await supabase
            .from('session_types')
            .insert({
                title: 'Window Test Service',
                category: 'CLASS',
                description: 'Testing 7-day window',
                image_url: 'https://placehold.co/400'
            })
            .select()
            .single();

        if (svcError) throw new Error(`Setup Failed (Service): ${svcError.message}`);
        testServiceId = service.id;

        // 2. Create a "Near" Session (2 days from now)
        const nearDate = new Date();
        nearDate.setDate(nearDate.getDate() + 2);
        nearDate.setHours(10, 0, 0, 0);
        const nearEnd = new Date(nearDate);
        nearEnd.setHours(11, 0, 0, 0);

        const { data: nearSess, error: nearError } = await supabase
            .from('sessions')
            .insert({
                title: 'Booking Near',
                start_time: nearDate.toISOString(),
                end_time: nearEnd.toISOString(),
                category: 'CLASS',
                session_type_id: testServiceId,
                instructor: 'Coach Window',
                max_capacity: 5,
                credit_cost: 5
            })
            .select()
            .single();
        if (nearError) throw new Error(`Setup Failed (Near Session): ${nearError.message}`);
        nearSessionId = nearSess.id;

        // 3. Create a "Far" Session (10 days from now)
        const farDate = new Date();
        farDate.setDate(farDate.getDate() + 10);
        farDate.setHours(10, 0, 0, 0);
        const farEnd = new Date(farDate);
        farEnd.setHours(11, 0, 0, 0);

        const { data: farSess, error: farError } = await supabase
            .from('sessions')
            .insert({
                title: 'Booking Far',
                start_time: farDate.toISOString(),
                end_time: farEnd.toISOString(),
                category: 'CLASS',
                session_type_id: testServiceId,
                instructor: 'Coach Window',
                max_capacity: 5,
                credit_cost: 5
            })
            .select()
            .single();
        if (farError) throw new Error(`Setup Failed (Far Session): ${farError.message}`);
        farSessionId = farSess.id;

        // 4. Create "Boundary OUT" Session (7 Days + 1 Hour)
        const boundDate = new Date();
        boundDate.setDate(boundDate.getDate() + 7);
        boundDate.setHours(boundDate.getHours() + 1); // Just outside
        const boundEnd = new Date(boundDate);
        boundEnd.setHours(boundEnd.getHours() + 1);

        await supabase.from('sessions').insert({
            title: 'Booking Boundary OUT',
            start_time: boundDate.toISOString(),
            end_time: boundEnd.toISOString(),
            category: 'CLASS',
            session_type_id: testServiceId,
            instructor: 'Coach Window',
            max_capacity: 5,
            credit_cost: 5
        });
    });

    test.afterAll(async () => {
        if (nearSessionId) await supabase.from('sessions').delete().eq('id', nearSessionId);
        if (farSessionId) await supabase.from('sessions').delete().eq('id', farSessionId);
        if (testServiceId) await supabase.from('session_types').delete().eq('id', testServiceId);
    });

    test('should only show sessions within the 7-day window', async ({ page }) => {
        try {
            await page.goto('/');

            // Wait for loading to finish
            await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 15000 });

            // Wait for services to load
            const serviceTile = page.locator('text=Window Test Service').first();
            await expect(serviceTile).toBeVisible({ timeout: 10000 });

            // Click the service to open the modal
            await serviceTile.click();

            // Wait for modal and check for Near Session
            // The modal header and content should show the session title
            await expect(page.locator('h2', { hasText: /Booking Near/i }).first()).toBeVisible();
            await expect(page.locator('text=Booking Near').first()).toBeVisible();

            // Check that Far Session is NOT visible
            await expect(page.locator('text=Booking Far')).not.toBeVisible();

            // Check that Boundary OUT Session is NOT visible
            // This confirms strict 7-day filtering
            await expect(page.locator('text=Booking Boundary OUT')).not.toBeVisible();
        } catch (error) {
            const html = await page.content();
            const fs = require('fs');
            fs.writeFileSync('debug_booking_window.html', html);
            console.log('Test failed. HTML saved to debug_booking_window.html');
            throw error;
        }
    });
});
