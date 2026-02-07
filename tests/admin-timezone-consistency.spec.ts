import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('Timezone Consistency Verification (Asia/Hong_Kong)', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('8 AM Generation should store as 00:00 UTC and display as 8:00 AM', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));

        // 1. Get a valid session type
        const { data: stypes } = await supabase.from('session_types').select('id, title').limit(1);
        if (!stypes || stypes.length === 0) throw new Error("No session types found in DB");
        const serviceId = stypes[0].id;
        const serviceTitle = stypes[0].title;
        const targetDate = '2026-03-01'; // Stable future date (Sunday)

        console.log(`Testing with service: ${serviceTitle} (ID: ${serviceId}) on ${targetDate}`);

        // 2. Generate a session at 8 AM via API
        const response = await page.request.post('/api/admin/generate-schedule', {
            data: {
                serviceId: serviceId,
                startDate: targetDate,
                endDate: targetDate,
                startHour: 8,
                endHour: 9,
                daysOfWeek: [0], // Sunday
                durationMinutes: 60
            }
        });

        if (!response.ok()) {
            const body = await response.text();
            console.error(`API Error (${response.status()}):`, body);
        }
        expect(response.ok()).toBeTruthy();
        const apiData = await response.json();
        console.log(`API Success: ${apiData.message} (Count: ${apiData.count})`);

        // 3. Database Check: Should be exactly 8 hours before local 8 AM (if UTC)
        const { data: sessions, error: dbError } = await supabase
            .from('sessions')
            .select('start_time, title')
            .eq('session_type_id', serviceId)
            .gte('start_time', `${targetDate}T00:00:00Z`)
            .lte('start_time', `${targetDate}T23:59:59Z`);

        if (dbError) console.error('DB Query Error:', dbError);
        console.log(`Found ${sessions?.length || 0} sessions in DB for this service/date.`);
        if (sessions) {
            sessions.forEach(s => console.log(` - ${s.title}: ${s.start_time}`));
        }

        expect(sessions?.length).toBeGreaterThan(0);

        const hasCorrectTime = sessions?.some(s => s.start_time.startsWith(`${targetDate}T00:00:00`));
        expect(hasCorrectTime).toBeTruthy();
        console.log(`Verified DB has session at 8 AM HK (00:00 UTC)`);

        // 4. UI Display Check: Should show "8:00am" regardless of runner timezone
        await page.goto('/sys-admin/schedule');
        await page.waitForLoadState('networkidle');

        // Navigate to the target date
        console.log(`Navigating UI to ${targetDate}`);
        await page.fill('input[type="date"]', targetDate);
        await page.waitForTimeout(2000);

        // Locate the session in UniversalSchedule/MasterSchedule
        const sessionCard = page.locator(`div:has-text("${serviceTitle}")`).first().locator('..').locator('text=/8:00\\s?am/i').first();
        await expect(sessionCard).toBeVisible({ timeout: 15000 });
        console.log('Verified UI display is 8:00 am');
    });
});
