import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Mobile Layout Visual Audit', () => {
    // We will run this on a mobile viewport
    test.use({ viewport: { width: 390, height: 844 } }); // iPhone 13/14

    let adminId: string;
    let coachId: string;
    let adminEmail: string;
    let coachEmail: string;
    const password = 'AuditLowLatency123!';

    test.beforeAll(async () => {
        const unique = Math.random().toString(36).substring(7);
        adminEmail = `audit-admin-${unique}@east.com`;
        coachEmail = `audit-coach-${unique}@east.com`;

        // 1. Create Admin
        const { data: adminData } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: password,
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'Visual', last_name: 'Admin' }
        });
        adminId = adminData.user!.id;
        await supabase.from('profiles').upsert({
            id: adminId,
            role: 'sys-admin',
            first_name: 'Visual',
            last_name: 'Admin',
            username: `vizadmin_${unique}`
        });

        // 2. Create Coach
        const { data: coachData } = await supabase.auth.admin.createUser({
            email: coachEmail,
            password: password,
            email_confirm: true,
            user_metadata: { role: 'coach', first_name: 'Visual', last_name: 'Coach' }
        });
        coachId = coachData.user!.id;
        await supabase.from('profiles').upsert({
            id: coachId,
            role: 'coach',
            first_name: 'Visual',
            last_name: 'Coach',
            username: `vizcoach_${unique}`
        });
    });

    test.afterAll(async () => {
        if (adminId) await supabase.auth.admin.deleteUser(adminId);
        if (coachId) await supabase.auth.admin.deleteUser(coachId);
    });

    test('Audit: Admin Portal Mobile Layout', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // Wait for redirect
        await page.waitForURL(/.*sys-admin/, { timeout: 15000 });

        // 1. Dashboard Screenshot
        await page.waitForTimeout(2000); // Allow animations
        await page.screenshot({ path: 'audit-screenshots/mobile-admin-dashboard.png', fullPage: true });

        // 2. Verify Menu Toggle
        const menuBtn = page.locator('button.p-2.-mr-2'); // The hamburger button we added
        await expect(menuBtn).toBeVisible();
        await menuBtn.click();
        await page.waitForTimeout(500); // Wait for menu open animation
        await page.screenshot({ path: 'audit-screenshots/mobile-admin-menu-open.png' });

        // 3. Navigate to Schedule via Menu
        // Use .last() or specific mobile container to pick the correct link (Desktop nav is still in DOM but hidden)
        await page.locator('.md\\:hidden').getByRole('link', { name: 'Schedule' }).click();
        await page.waitForURL(/.*sys-admin\/schedule/);
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'audit-screenshots/mobile-admin-schedule.png', fullPage: true });

        // 4. Navigate to People Directory
        await page.goto('/sys-admin/directory');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'audit-screenshots/mobile-admin-directory.png', fullPage: true });

        // 5. Open Add Modal (Verify responsive inputs)
        await page.getByText('Add Parent').click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'audit-screenshots/mobile-admin-add-modal.png' });
    });

    test('Audit: Coach Portal Mobile Layout', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', coachEmail);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // Wait for dashboard (CoachDashboard is on root / but strictly conditionally rendered)
        await page.waitForFunction(() => document.body.innerText.includes('EAST COACH'), { timeout: 15000 });

        // 1. Dashboard Header (Check Available Hours visibility)
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'audit-screenshots/mobile-coach-dashboard.png', fullPage: true });

        // 2. Click "My Schedule"
        await page.getByText('My Schedule').click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'audit-screenshots/mobile-coach-myschedule.png', fullPage: true });
    });
});
