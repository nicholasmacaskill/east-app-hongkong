import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('Parent Profile Photo Locking', () => {
    let testUser: any;

    test.beforeAll(async () => {
        const email = `parent-locking-${Date.now()}@east.com`;
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: {
                role: 'parent',
                first_name: 'Test',
                last_name: 'Parent'
            }
        });

        if (authError) throw authError;
        testUser = authUser.user;

        // Ensure profile is active and has correct role
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                role: 'parent',
                account_status: 'active',
                subscription_status: 'active',
                first_name: 'Test',
                last_name: 'Parent'
            })
            .eq('id', testUser.id);

        if (profileError) throw profileError;
    });

    test.afterAll(async () => {
        if (testUser) {
            await supabaseAdmin.auth.admin.deleteUser(testUser.id);
        }
    });

    test('Parent should not see cover photo edit button and avatar should be read-only', async ({ page }) => {
        // 1. Landing Screen - Select Parent Portal
        await page.goto('/');

        // Find the parent section and click LOGIN
        const parentSection = page.locator('div:has(p:text-is("parent"))');
        await parentSection.getByRole('button', { name: 'LOGIN' }).click();

        // 2. Auth Screen - Login
        await page.fill('input[placeholder="Enter your email"]', testUser.email);
        await page.fill('input[placeholder="Enter your password"]', 'Password123!');
        await page.click('button[type="submit"], button:has-text("LOGIN")');

        // Wait for redirect to home
        await page.waitForTimeout(2000); // Give it a moment to process login state
        // await page.waitForURL('**/', { timeout: 10000 });

        // 2. Click Profile Tab
        await page.click('button:has-text("Profile")');

        // Ensure we are on the profile screen (check for Parent name)
        await expect(page.locator('h1:has-text("Test Parent")')).toBeVisible({ timeout: 10000 });

        // 3. Verify Cover Photo Edit button is NOT visible
        // The button has title="Update Cover Photo"
        const coverEditBtn = page.locator('button[title="Update Cover Photo"]');
        await expect(coverEditBtn).not.toBeVisible();

        // 4. Verify Avatar container does NOT have cursor-pointer class
        const avatarContainer = page.locator('[data-testid="parent-avatar-container"]');
        await expect(avatarContainer).not.toHaveClass(/cursor-pointer/);

        // 5. Verify the Camera/Edit icons are NOT inside the avatar container
        const avatarEditIcon = avatarContainer.locator('svg');
        await expect(avatarEditIcon).not.toBeVisible();
    });
});
