import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Admin User Creation with Password', () => {
    let testUserEmail: string;
    const testPassword = 'ImmediateLogin123!';

    test.beforeEach(async () => {
        testUserEmail = `immediate-login-${Date.now()}@east.com`;
    });

    test.afterEach(async () => {
        // Cleanup
        const { data: user } = await supabase.from('profiles').select('id').eq('contact_email', testUserEmail).single();
        if (user) {
            await supabase.auth.admin.deleteUser(user.id);
            await supabase.from('profiles').delete().eq('id', user.id);
        }
    });

    test('Admin can create a parent and they can login immediately', async ({ page, browser }) => {
        // 1. LOGIN AS ADMIN (Using storage state from admin-chromium project)
        // Note: For this test to work in this file, we assume we are running in the 'admin-chromium' project
        // or we manually login. Let's manually login for maximum isolation.

        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@east.com');
        await page.fill('input[type="password"]', 'EastAdmin2026!'); // Using the recovered admin credentials
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/sys-admin');

        // 2. NAVIGATE TO DIRECTORY
        await page.goto('/sys-admin/directory');

        // 3. CREATE NEW PARENT
        await page.click('button:has-text("Add Parent")');

        // Use more robust selectors based on labels
        await page.locator('div:has(> label:has-text("First Name")) >> input').fill('Immediate');
        await page.locator('div:has(> label:has-text("Last Name")) >> input').fill('User');
        await page.locator('div:has(> label:has-text("Email (Invite Link)")) >> input').fill(testUserEmail);
        await page.locator('div:has(> label:has-text("Set Password (Optional)")) >> input').fill(testPassword);

        await page.click('button:has-text("Send Invite")');

        // Wait for success modal
        await expect(page.locator('h2:has-text("Invite Sent!")')).toBeVisible({ timeout: 15000 });
        await page.click('button:has-text("Confirm")');

        // 4. VERIFY LOGIN IN NEW BROWSER CONTEXT
        const context = await browser.newContext();
        const newPage = await context.newPage();

        await newPage.goto('/login');
        await newPage.fill('input[type="email"]', testUserEmail);
        await newPage.fill('input[type="password"]', testPassword);
        await newPage.click('button[type="submit"]');

        // Should land on home page (Parent/Athlete view)
        await expect(newPage).toHaveURL(/\//);
        // Should see user name
        await expect(newPage.locator('text=Immediate User')).toBeVisible();

        await context.close();
    });
});
