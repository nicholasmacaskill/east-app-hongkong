
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Schedule Generator - Wipe & Replace Verification', () => {
    let adminId: string;
    let adminEmail: string;
    const adminPassword = 'AdminPassword123!';
    const testFacilityId = 'a69bf177-274f-4a2e-a139-6dd9c29d639a'; // Golf Sim - South Bay

    test.beforeAll(async () => {
        const unique = Math.random().toString(36).substring(7);
        adminEmail = `generator-verify-admin-${unique}@east.com`;

        // Create a Test Admin
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'Gen', last_name: 'Verify' }
        });
        if (adminError) throw adminError;
        adminId = adminData.user!.id;
        await supabase.from('profiles').upsert({ id: adminId, role: 'sys-admin', first_name: 'Gen', last_name: 'Verify' });
    });

    test.afterAll(async () => {
        if (adminId) await supabase.auth.admin.deleteUser(adminId);
        // Cleanup generated sessions for this test facility
        await supabase.from('sessions').delete().eq('session_type_id', testFacilityId);
    });

    test('Generator should wipe existing slots before generating new ones', async ({ page }) => {
        // 1. Login as Admin
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*sys-admin/);

        // 2. Go to Manage Services
        await page.goto('/sys-admin/services');
        await expect(page.getByText('Manage Services')).toBeVisible();

        // 3. Find Golf Sim - South Bay and open generator
        // We look for the card containing the title and click its "Generate Schedule" button
        const card = page.locator('div', { hasText: /Golf Sim - South Bay/i }).filter({ has: page.locator('button:has-text("Generate Schedule")') });
        await card.locator('button:has-text("Generate Schedule")').click();

        // 4. Set Generator Config (1 day, 9am-10am - total 1 slot)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        await page.fill('input[type="date"] >> nth=0', dateStr); // Start
        await page.fill('input[type="date"] >> nth=1', dateStr); // End
        await page.fill('input[type="number"] >> nth=0', '9');    // Start hour
        await page.fill('input[type="number"] >> nth=1', '10');   // End hour

        // 5. Generate first time
        await page.click('button:has-text("Generate Slots Now")');
        await expect(page.getByText(/Generated 1 sessions/i)).toBeVisible({ timeout: 15000 });
        await page.click('button:has-text("X")'); // Close toast or wait for it to fade

        // Verify in DB (should have 1 slot)
        const { data: slots1 } = await supabase.from('sessions').select('id').eq('session_type_id', testFacilityId);
        expect(slots1?.length).toBe(1);

        // 6. Generate a SECOND time with DIFFERENT hours (11am-12pm)
        await card.locator('button:has-text("Generate Schedule")').click();
        await page.fill('input[type="date"] >> nth=0', dateStr);
        await page.fill('input[type="date"] >> nth=1', dateStr);
        await page.fill('input[type="number"] >> nth=0', '11');
        await page.fill('input[type="number"] >> nth=1', '12');
        await page.click('button:has-text("Generate Slots Now")');

        // Verify success message
        await expect(page.getByText(/Generated 1 sessions/i)).toBeVisible({ timeout: 15000 });

        // 7. Verify in DB - should STILL have only 1 slot (the old one should have been wiped)
        const { data: slots2 } = await supabase.from('sessions').select('id').eq('session_type_id', testFacilityId);
        expect(slots2?.length).toBe(1);

        console.log('✅ Wipe & Replace logic verified successfully.');
    });
});
