import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe.configure({ mode: 'serial' });

test.describe('Public & Authentication Flows', () => {
    let testUserId: string;
    // Shared email for registration and reset tests
    const testEmail = `pub-test-${Date.now()}@east.com`;

    test.afterAll(async () => {
        if (testUserId) {
            console.log(`[CLEANUP] Deleting user ${testUserId}`);
            await supabase.auth.admin.deleteUser(testUserId);
            await supabase.from('profiles').delete().eq('id', testUserId);
        } else {
            // Try to find it one last time to clean up
            const { data } = await supabase.from('profiles').select('id').eq('email', testEmail).single();
            if (data) {
                await supabase.auth.admin.deleteUser(data.id);
                await supabase.from('profiles').delete().eq('id', data.id);
            }
        }
    });

    test('Visitor Landing: Navigation and Static Pages', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('img[alt="EAST Logo"]')).toBeVisible();
        await page.goto('/faq');
        await expect(page.locator('h1')).toContainText("FAQ's");
        await page.goto('/terms');
        await expect(page.locator('h1')).toContainText("Terms & Conditions");
        console.log('[TEST] Landing & Static pages verified');
    });

    test('Account Creation: Full Sign-up Flow', async ({ page }) => {
        page.on('dialog', async dialog => {
            console.log(`[AUTH ALERT] ${dialog.message()}`);
            await dialog.dismiss();
        });

        await page.goto('/');
        await page.click('text=PLAYER LOGIN');
        await page.click('text=Register Now');

        await page.fill('input[name="fullName"]', 'Public Tester');
        await page.fill('input[name="phone"]', '+852 9999 8888');
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="password"]', 'TestPass123!');

        await page.click('button:has-text("CREATE ACCOUNT")');

        // Wait for potential auto-redirect or success message
        await page.waitForTimeout(5000);
        const bodyText = await page.innerText('body');

        if (bodyText.includes('WELCOME TO EAST') || bodyText.includes('check your email')) {
            console.log('[TEST] Signup reached Success/Confirm Screen');
        } else {
            console.log('[TEST] Signup presumably auto-logged in');
        }

        // We verify that the user was created in the DB at least
        console.log(`[TEST] Verifying DB for ${testEmail}`);
        let found = false;
        for (let i = 0; i < 5; i++) {
            const { data } = await supabase.from('profiles').select('id').eq('email', testEmail).single();
            if (data) {
                testUserId = data.id;
                found = true;
                break;
            }
            await page.waitForTimeout(2000);
        }

        if (!found) {
            // Check auth.users as fallback
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const user = users.find(u => u.email === testEmail);
            if (user) {
                testUserId = user.id;
                console.log(`[TEST] User found in Auth but not Profile yet: ${testUserId}`);
                found = true;
            }
        }

        expect(found).toBe(true);
        console.log(`[TEST] Signup verified. ID: ${testUserId}`);
    });

    test('Self-Service Password Reset: Request Flow', async ({ page }) => {
        page.on('dialog', async dialog => {
            console.log(`[RESET ALERT] ${dialog.message()}`);
            await dialog.dismiss();
        });

        await page.goto('/');
        await page.click('text=PLAYER LOGIN');
        await page.click('text=Forgot Password?');

        await page.waitForURL('**/forgot-password');
        await page.fill('input[type="email"]', testEmail);
        await page.click('button:has-text("SEND RESET CODE")');

        await expect(page.locator('text=Check Your Email')).toBeVisible();
        console.log('[TEST] Password reset requested for confirmed user');
    });

    test('Discovery: Public Profiles Visibility', async ({ page }) => {
        const { data: coach } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, username')
            .eq('role', 'coach')
            .limit(1)
            .single();

        if (coach) {
            await page.goto(`/public/coach/${coach.id}`);
            await expect(page.locator('text=Loading Profile...')).not.toBeVisible();
            const displayName = coach.first_name || coach.username || 'Coach';
            await expect(page.locator('body')).toContainText(new RegExp(displayName, 'i'));
            console.log(`[TEST] Discovery verified for ${displayName}`);
        }
    });
});
