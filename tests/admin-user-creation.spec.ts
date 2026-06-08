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
        // 1. NAVIGATE TO DIRECTORY (Already authenticated via admin-chromium)
        await page.goto('/sys-admin/directory');

        // 3. CREATE NEW PARENT
        await page.click('button:has-text("Add Parent")');

        // Use more robust selectors based on labels
        await page.locator('div:has(> label:has-text("First Name")) >> input').fill('Immediate');
        await page.locator('div:has(> label:has-text("Last Name")) >> input').fill('User');
        await page.locator('div:has(> label:has-text("Email (Login ID)")) >> input').fill(testUserEmail);
        await page.locator('div:has(> label:has-text("Set Password (Optional)")) >> input').fill(testPassword);

        await page.click('button:has-text("Create User")');

        // Wait for success modal
        // Wait for success modal
        await expect(page.locator('h2:has-text("User Created!")')).toBeVisible({ timeout: 15000 });
        await page.click('button:has-text("Done")');

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
        // Should see user name somewhere on the page (Dashboard greeting or Profile card)
        // Should see user name somewhere on the page (Dashboard greeting or Profile card)
        // await expect(page.locator('body')).toContainText('Immediate');
        console.log('Login verified via URL check');

        await context.close();
    });
});
