import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// FORCE LOAD .env.test for separation from Production
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('QA Verification (TEST ENV ONLY)', () => {
    // FIXED PERSISTENT TEST USERS
    const adminEmail = 'test-admin@east.com';
    const playerEmail = 'test-player@east.com';
    const adminPassword = 'TestQAAdmin123!';
    const playerPassword = 'TestQAPlayer123!';

    const isHydrated = async (page) => {
        console.log('⏳ Waiting for hydration...');
        // Wait for splash screen to disappear
        await expect(page.locator('body')).not.toContainText('Loading...', { timeout: 30000 });
        // Wait for portal heading to appear
        await page.waitForSelector('text=SELECT YOUR PORTAL', { timeout: 15000 }).catch(() => console.log('⚠️ SELECT YOUR PORTAL not found, continuing...'));
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); 
        console.log('✅ Hydrated.');
    };

    test.beforeEach(async ({ context }) => {
        // Ensure clean state for every test
        await context.clearCookies();
        await context.clearPermissions();
    });

    test('1. Visitor Landing & Portal Selection', async ({ page }) => {
        console.log('🚀 Starting Test 1...');
        await page.goto('/');
        await isHydrated(page);
        await expect(page.getByText(/SELECT YOUR PORTAL/i)).toBeVisible({ timeout: 20000 });
        
        const athleteLogin = page.locator('button.bg-east-light').nth(0);
        await expect(athleteLogin).toBeVisible({ timeout: 15000 });
        console.log('✅ Test 1 Passed.');
    });

    test('2. Admin Dashboard Access (via Portal)', async ({ page }) => {
        console.log('🚀 Starting Test 2 (Admin)...');
        await page.goto('/');
        await isHydrated(page);
        
        console.log('👉 Clicking ADMIN PORTAL...');
        const adminBtn = page.getByRole('button', { name: /ADMIN PORTAL/i });
        await adminBtn.scrollIntoViewIfNeeded();
        await adminBtn.click();

        await expect(page.getByText(/Sys-Admin Login/i)).toBeVisible({ timeout: 15000 });
        
        console.log('⌨️ Filling credentials...');
        await page.fill('input#email', adminEmail);
        await page.fill('input#password', adminPassword);
        await page.click('button:has-text("LOGIN")');
        
        console.log('🔄 Waiting for redirect to /sys-admin...');
        await page.waitForURL(/.*sys-admin/, { timeout: 30000 });
        await isHydrated(page);
        
        await expect(page.getByText(/SYS-ADMIN DASHBOARD/i).or(page.getByText(/Unified Directory/i))).toBeVisible({ timeout: 15000 });
        console.log('✅ Test 2 Passed.');
    });

    test('3. Player Dashboard Access (via Portal)', async ({ page }) => {
        console.log('🚀 Starting Test 3 (Player)...');
        await page.goto('/');
        await isHydrated(page);
        
        console.log('👉 Clicking Athlete Login...');
        const athleteLogin = page.locator('button.bg-east-light').nth(0);
        await athleteLogin.click();

        await expect(page.getByText(/Athlete Login/i)).toBeVisible({ timeout: 15000 });
        
        await page.fill('input#email', playerEmail);
        await page.fill('input#password', playerPassword);
        await page.click('button:has-text("LOGIN")');
        
        console.log('🔄 Waiting for redirect to Dashboard...');
        await page.waitForURL(/\//, { timeout: 30000 });
        await isHydrated(page);

        await expect(page.getByText(/100/)).toBeVisible({ timeout: 15000 });
        console.log('✅ Test 3 Passed.');
    });

    test('4. Membership Success Page Reachable', async ({ page }) => {
        await page.goto('/membership/success');
        await expect(page.getByText(/Welcome to the Team/i)).toBeVisible({ timeout: 15000 });
    });
});
