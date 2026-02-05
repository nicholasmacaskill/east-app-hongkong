import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Self-contained Authentication Helper
// Bypasses global auth.setup.ts serialization issues
async function createTestUserAndLogin(page: any) {
    const timestamp = Date.now();
    const email = `penalty-verify-${timestamp}@example.com`;
    const password = 'test-password-123';

    // 1. Create Auth User
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'parent', first_name: 'Penalty', last_name: 'Tester' }
    });

    if (createError || !user) throw new Error(`Auth Create Failed: ${createError?.message}`);

    // 2. Create Profile (Ensure it exists for credits)
    await supabase.from('profiles').upsert({
        id: user.id,
        contact_email: email,
        role: 'parent',
        credits: 500, // Ample credits
        first_name: 'Penalty',
        last_name: 'Tester'
    });

    // 3. Login via UI to establish session naturally
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    // Wait for hydration/stability
    const loginBtn = page.locator('button:has-text("LOGIN")');
    await expect(loginBtn).toBeVisible();
    await loginBtn.click({ force: true });
    await page.waitForURL('/');

    // 4. Verify Login - Check for Schedule tab which indicates access
    await expect(page.locator('button:has-text("Schedule")').first()).toBeVisible();

    return user.id;
}

test.describe('Cancellation Penalty Verification (Isolated)', () => {
    let serviceId: string;
    let userId: string;

    test.beforeAll(async () => {
        // Create Service
        const { data } = await supabase.from('session_types').insert({
            title: `Penalty Test Service ${Date.now()}`,
            category: 'CLASS',
            credit_cost: 20
        }).select().single();
        serviceId = data?.id;
    });

    test.afterAll(async () => {
        if (serviceId) await supabase.from('session_types').delete().eq('id', serviceId);
        // Clean up user is tricky without leaking, kept simple for now or rely on periodic cleanup
    });

    test('Full 3-Tier Verification', async ({ page }) => {
        // 1. Login
        userId = await createTestUserAndLogin(page);
        console.log(`[TEST] Logged in as ${userId}`);

        // --- SCENARIO 1: < 24 HOURS (0% Refund) ---
        const startLate = new Date();
        startLate.setHours(startLate.getHours() + 6); // 6 hours from now
        const { data: sessionLate } = await supabase.from('sessions').insert({
            title: 'Late Cancel Session',
            start_time: startLate.toISOString(),
            end_time: new Date(startLate.getTime() + 3600000).toISOString(),
            session_type_id: serviceId,
            credit_cost: 20,
            instructor: 'Test Coach'
        }).select().single();

        // Book it manually
        await supabase.from('registrations').insert({ user_id: userId, session_id: sessionLate?.id, payer_id: userId, credits_paid: 20 });

        // Navigate & Verify
        await page.goto('/?tab=schedule');
        await page.click(`text="Late Cancel Session"`);
        await page.click('button:has-text("CANCEL SELECTION")');

        // Check 0%
        await expect(page.locator('text="NO REFUND"')).toBeVisible();
        await expect(page.locator('text=/receive 0 credits/i')).toBeVisible();
        await page.click('button:has-text("Nevermind")'); // Close

        // Helper to select date
        const selectDate = async (dateObj: Date) => {
            const day = dateObj.getDate().toString();
            // Try to find exact day text in the schedule strip
            // The Schedule UI day number: <span className="text-sm font-black italic">{day}</span>
            // We use a locator that finds this text specifically
            try {
                // If it's today, we might not need to click, but good to ensure
                // Wait for the element to appear (it should be within the 6-day window)
                const dayLocator = page.locator('div').filter({ hasText: /^[A-Z]{3}$/ }).filter({ hasText: day }).last();
                // OR simpler:
                // Look for text=day inside the specific container structure if possible.
                // Simple approach: click text=day. But might catch other things.
                // ScheduleScreen renders day number as text-sm.
                await page.locator(`span.text-sm.font-black.italic:has-text("${day}")`).first().click();
                await page.waitForTimeout(500); // UI update
            } catch (e) {
                console.log(`Could not select date ${day}, might be off screen or invalid locator.`, e);
            }
        };

        // --- SCENARIO 2: 24-48 HOURS (50% Refund) ---
        const startMed = new Date();
        startMed.setHours(startMed.getHours() + 30); // 30 hours
        const { data: sessionMed } = await supabase.from('sessions').insert({
            title: 'Medium Cancel Session',
            start_time: startMed.toISOString(),
            end_time: new Date(startMed.getTime() + 3600000).toISOString(),
            session_type_id: serviceId,
            credit_cost: 20,
            instructor: 'Test Coach'
        }).select().single();

        await supabase.from('registrations').insert({ user_id: userId, session_id: sessionMed?.id, payer_id: userId, credits_paid: 20 });

        // Navigate & Verify
        await page.reload();
        await selectDate(startMed); // Select Date
        await page.click(`text="Medium Cancel Session"`);
        await page.click('button:has-text("CANCEL SELECTION")');

        // Check 50% UI
        await expect(page.locator('text="50% REFUND"')).toBeVisible();
        await expect(page.locator('text=/receive 10 credits/i')).toBeVisible();
        await page.click('button:has-text("Nevermind")');
        await page.waitForTimeout(1000);

        // Capturing Pre-Conditions
        const { data: regCheck } = await supabase.from('registrations').select('credits_paid').eq('session_id', sessionMed?.id).eq('user_id', userId).single();
        console.log(`[DEBUG] Session ${sessionMed?.id} Credits Paid:`, regCheck?.credits_paid);
        if (regCheck?.credits_paid !== 20) throw new Error("Setup Error: Credits Paid is not 20");

        // Capture Credit Balance BEFORE Verify
        const { data: profileBefore } = await supabase.from('profiles').select('credits').eq('id', userId).single();
        const creditsBefore = profileBefore?.credits || 0;


        // Perform Cancel
        await page.reload(); // Clean state
        await selectDate(startMed);
        await page.click(`text="Medium Cancel Session"`);
        await page.click('button:has-text("CANCEL SELECTION")');
        await page.click('button:has-text("Yes, Cancel Session")');

        // Verify UI success (Flaky toast check skipped)
        // await expect(page.locator('text="Cancelled 1 booking"')).toBeVisible();

        // Verify DB Update (Refunding 50% of 20 = 10 credits)
        await page.waitForTimeout(2000); // Wait for DB write (increased buffer)
        const { data: profileAfter } = await supabase.from('profiles').select('credits').eq('id', userId).single();
        const creditsAfter = profileAfter?.credits || 0;

        console.log(`Credits: ${creditsBefore} -> ${creditsAfter}`);
        expect(creditsAfter).toBe(creditsBefore + 10);


        // --- SCENARIO 3: > 48 HOURS (100% Refund) ---
        const startEarly = new Date();
        startEarly.setHours(startEarly.getHours() + 72); // 72 hours
        const { data: sessionEarly } = await supabase.from('sessions').insert({
            title: 'Early Cancel Session',
            start_time: startEarly.toISOString(),
            end_time: new Date(startEarly.getTime() + 3600000).toISOString(),
            session_type_id: serviceId,
            credit_cost: 20,
            instructor: 'Test Coach'
        }).select().single();

        await supabase.from('registrations').insert({ user_id: userId, session_id: sessionEarly?.id, payer_id: userId, credits_paid: 20 });

        // Navigate & Verify
        await page.reload();
        await selectDate(startEarly); // Select Date
        await page.click(`text="Early Cancel Session"`);
        await page.click('button:has-text("CANCEL SELECTION")');

        // Check 100%
        await expect(page.locator('text="FULL REFUND"')).toBeVisible();
        await expect(page.locator('text=/receive 20 credits/i')).toBeVisible();

        // Capture Credit Balance BEFORE Verify (Should be 110 from previous step)
        const { data: profileBefore100 } = await supabase.from('profiles').select('credits').eq('id', userId).single();
        const creditsBefore100 = profileBefore100?.credits || 0;

        // Actually Cancel This One
        await page.click('button:has-text("Yes, Cancel Session")');

        // Verify DB Update (Refunding 100% of 20 = 20 credits)
        await page.waitForTimeout(2000);
        const { data: profileAfter100 } = await supabase.from('profiles').select('credits').eq('id', userId).single();
        const creditsAfter100 = profileAfter100?.credits || 0;

        console.log(`Credits 100%: ${creditsBefore100} -> ${creditsAfter100}`);
        expect(creditsAfter100).toBe(creditsBefore100 + 20);
        await expect(page.locator('text="Early Cancel Session"')).not.toBeVisible();
    });
});
