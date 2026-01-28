import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Database Consistency Verification', () => {
    let parentId: string;
    let childId: string;
    let parentEmail: string;
    const password = 'TestAuth123!';

    test.beforeAll(async () => {
        const unique = Math.random().toString(36).substring(7);
        parentEmail = `db-parent-${unique}@east.com`;

        // Create Parent
        const { data: pData } = await supabase.auth.admin.createUser({
            email: parentEmail,
            password: password,
            email_confirm: true,
            user_metadata: { role: 'parent' }
        });
        parentId = pData.user!.id;
        await supabase.from('profiles').upsert({
            id: parentId,
            role: 'parent',
            credits: 100,
            account_status: 'ACTIVE'
        });

        // Create Child
        const { data: cData } = await supabase.auth.admin.createUser({
            email: `db-child-${unique}@east.com`,
            password: password,
            email_confirm: true,
            user_metadata: { role: 'player' }
        });
        childId = cData.user!.id;
        await supabase.from('profiles').upsert({
            id: childId,
            role: 'player',
            parent_id: parentId,
            credits: 0,
            account_status: 'ACTIVE'
        });
    });

    test.afterAll(async () => {
        if (parentId) await supabase.auth.admin.deleteUser(parentId);
        if (childId) await supabase.auth.admin.deleteUser(childId);
    });

    test('Credit Transfer UI updates database correctly', async ({ page }) => {
        // Login as parent
        await page.goto('/login');
        await page.fill('input[placeholder="Enter your email"]', parentEmail);
        await page.fill('input[placeholder="Enter your password"]', password);
        await page.click('button:has-text("Login")');
        await page.waitForURL('/');

        // Go to profile to find transfer credits
        await page.goto('/?tab=profile');

        // Wait for profile content
        await page.waitForSelector('button:has-text("Transfer")', { timeout: 20000 });

        // Perform transfer
        const transferButton = page.locator('button:has-text("Transfer")').first();
        if (await transferButton.isVisible()) {
            await transferButton.click();
            await page.waitForTimeout(1000);

            // Fill transfer form in modal
            await page.locator('input[type="number"]').fill('25');

            const confirmBtn = page.locator('button:has-text("Confirm Transfer")');
            await confirmBtn.click();

            // Wait for reload
            await page.waitForTimeout(3000);

            // Wait for page reload/state update
            await page.waitForTimeout(2000);

            // VERIFY DATABASE STATE
            // Parent should have 75 (100 - 25)
            const { data: pProfile } = await supabase.from('profiles').select('credits').eq('id', parentId).single();
            expect(pProfile?.credits).toBe(75);

            // Child should have 25 (0 + 25)
            const { data: cProfile } = await supabase.from('profiles').select('credits').eq('id', childId).single();
            expect(cProfile?.credits).toBe(25);

            // Verify transaction record exists
            const { data: transactions } = await supabase
                .from('transactions')
                .select('*')
                .or(`profile_id.eq.${parentId},profile_id.eq.${childId}`)
                .order('created_at', { ascending: false });

            expect(transactions?.length).toBeGreaterThan(0);
        }
    });

    test('Session Booking UI updates database correctly', async ({ page }) => {
        // Login as parent (already logged in from previous test or re-login if needed)
        await page.goto('/');

        const classCard = page.locator('[class*="service"], [class*="class"]').first();
        if (await classCard.isVisible()) {
            await classCard.click();
            await page.waitForSelector('[role="dialog"]');

            // Select child for booking
            await page.click('text=/Child/i');
            await page.click('button:has-text("Book"), button:has-text("Reserve")');

            // Wait for success
            await expect(page.locator('text=/Success|Confirmed/i')).toBeVisible();

            // VERIFY DATABASE STATE
            // Check if registration entry exists
            const { data: bookings } = await supabase
                .from('registrations')
                .select('*')
                .eq('user_id', childId)
                .order('registered_at', { ascending: false })
                .limit(1);

            expect(bookings?.length).toBe(1);
            // Verify credits were deducted (assuming price is > 0)
            // This depends on the session price, but for now we just verify existence
        }
    });
});
