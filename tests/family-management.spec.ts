import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * FAMILY MANAGEMENT TESTS
 * 
 * Verifies:
 * 1. Parent can add a new child/athlete.
 * 2. New child has a linked profile and auth entry.
 * 3. Parent can transfer credits to the child.
 */

test.describe('Family Management System', () => {
    let parentId: string;
    let parentEmail: string;

    test.beforeEach(async () => {
        parentEmail = `parent-test-${Date.now()}@east.com`;

        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email: parentEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'parent', first_name: 'Super', last_name: 'Parent' }
        });

        if (createError) throw createError;
        parentId = userData.user.id;

        await supabase.from('profiles').upsert({
            id: parentId,
            role: 'parent',
            first_name: 'Super',
            last_name: 'Parent',
            credits: 1000
        });
    });

    test.afterEach(async () => {
        if (parentId) {
            // Cleanup children first would be ideal, but for now we delete the parent
            await supabase.auth.admin.deleteUser(parentId);
        }
    });

    test('Add Child & Transfer Credits: Full parent flow', async ({ page }) => {
        // 1. Login as Parent
        await page.goto('/login');
        await page.fill('input[type="email"]', parentEmail);
        await page.fill('input[type="password"]', 'TestPassword123!');
        await page.click('button[type="submit"]');

        // 2. Go to Profile Tab
        await page.click('button:has-text("Profile")');

        // 3. Click "Register New Athlete"
        await page.click('button:has-text("Register New Athlete")');

        // 4. Fill Child Details
        const childEmail = `child-${Date.now()}@east.com`;
        await page.fill('input[placeholder="e.g. Michael"]', 'Little');
        await page.fill('input[placeholder="e.g. Jordan"]', 'Athlete');
        await page.fill('input[type="email"]', childEmail);
        await page.fill('input[placeholder="e.g. Ice Hockey"]', 'Junior Golf');

        // 5. Save
        await page.click('button:has-text("Save")');

        // Handle alert if it appears
        page.on('dialog', dialog => dialog.accept());

        // 6. Verify Child exists in list
        await page.waitForSelector('h4:has-text("Little")', { state: 'visible' });
        await expect(page.locator('h4:has-text("Little")')).toBeVisible();

        // 7. Transfer Credits
        await page.click('button:has-text("+ Transfer")');
        await page.waitForSelector('input[type="number"]', { state: 'visible' });
        await page.fill('input[type="number"]', '100');
        await page.click('button:has-text("Confirm Transfer")');

        // 8. Wait for reload and verify Balances in UI (Higher Resilience)
        await page.waitForLoadState('networkidle');

        // Poll for the 900 balance which indicates the transfer processed
        await expect(page.locator('span:has-text("900")')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('span:has-text("100")').first()).toBeVisible({ timeout: 10000 });

        // 9. Verify DB Link
        const { data: childProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('contact_email', childEmail)
            .single();

        expect(childProfile).toBeDefined();
        expect(childProfile.parent_id).toBe(parentId);
        expect(childProfile.credits).toBe(100);
    });
});
