import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Registration Flow', () => {
    let testUserId: string;
    let testUserEmail: string;
    const testPassword = 'TestPassword123!';

    test.afterAll(async () => {
        // Cleanup
        if (testUserId) {
            await supabase.auth.admin.deleteUser(testUserId);
            await supabase.from('profiles').delete().eq('id', testUserId);
        }
    });

    test('Admin creates user, user resets password and logs in', async ({ page, context }) => {
        // Console logging
        page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));

        // 1. Admin Creates User via Directory
        await page.goto('/sys-admin/directory?tab=households');
        await expect(page.locator('h1:has-text("People Directory")')).toBeVisible();

        // Click "Add Parent" button (purple button in header)
        const addButton = page.locator('button:has-text("Add Parent")');
        await addButton.click();
        await page.waitForTimeout(1000);

        // Wait for modal to appear
        await expect(page.locator('h2:has-text("Add New Household")')).toBeVisible({ timeout: 5000 });

        // Fill form - inputs appear in order
        testUserEmail = `test-reg-${Date.now()}@east.com`;

        const inputs = page.locator('.flex.flex-col.gap-4 input');
        await inputs.nth(0).fill('TestReg'); // First Name
        await inputs.nth(1).fill('User'); // Last Name
        await inputs.nth(2).fill(testUserEmail); // Email

        // Submit - look for "Send Invite" button
        const createButton = page.locator('button:has-text("Send Invite")');
        await createButton.click();

        // Wait for success indicator
        await page.waitForTimeout(3000);

        // 2. Verify user was created in database
        const { data: users, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) throw userError;

        const createdUser = users.users.find(u => u.email === testUserEmail);
        expect(createdUser).toBeTruthy();
        testUserId = createdUser!.id;

        console.log(`[TEST] Created user: ${testUserId}, email: ${testUserEmail}`);

        // 3. Generate password reset link
        const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: testUserEmail
        });

        if (resetError) throw new Error(`Reset link generation failed: ${resetError.message}`);

        const resetLink = resetData.properties.action_link;
        console.log(`[TEST] Generated reset link: ${resetLink.substring(0, 50)}...`);

        // 4. Log out as admin
        await page.goto('/');
        // Clear session by clearing storage state
        await context.clearCookies();
        await page.evaluate(() => localStorage.clear());

        // 5. Navigate to reset link (sets password)
        await page.goto(resetLink);
        await page.waitForTimeout(1000);

        // Look for password input field
        const passwordInput = page.locator('input[type="password"]').first();
        await expect(passwordInput).toBeVisible({ timeout: 10000 });

        await passwordInput.fill(testPassword);

        // If there's a confirm password field
        const confirmInput = page.locator('input[type="password"]').nth(1);
        const confirmExists = await confirmInput.count();
        if (confirmExists > 0) {
            await confirmInput.fill(testPassword);
        }

        // Click update/submit button
        const submitButton = page.locator('button:has-text("Update"), button:has-text("Set Password"), button:has-text("Reset Password")').first();
        await submitButton.click();
        await page.waitForTimeout(2000);

        // 6. Navigate to login page
        await page.goto('/login');
        await page.waitForTimeout(1000);

        // 7. Fill login form
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible({ timeout: 10000 });

        await emailInput.fill(testUserEmail);
        await page.locator('input[type="password"]').fill(testPassword);

        // 8. Click sign in button
        const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log In")').first();
        await signInButton.click();

        // 9. Verify successful login - should redirect to home/dashboard
        await page.waitForURL('**/', { timeout: 10000 });

        // Verify we're logged in by checking for user-specific elements
        // Could be "My Schedule", user name, or credits display
        const loggedInIndicator = page.locator('text="My Schedule", text="Credits", h1').first();
        await expect(loggedInIndicator).toBeVisible({ timeout: 5000 });

        console.log('[TEST] Successfully logged in as new user');

        // 10. Verify user profile exists in database
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', testUserId)
            .single();

        expect(profile).toBeTruthy();
        expect(profile?.first_name).toBe('TestReg');
        expect(profile?.last_name).toBe('User');
        expect(profile?.role).toBe('parent');
    });
});
