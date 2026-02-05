import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Cancellation Flow', () => {
    let testServiceId: string;
    let testSessionId: number;
    let parentId: string;
    let testSessionTitle = `Cancellation Test Session ${Date.now()}`;

    // Setup: Create Session
    test.beforeAll(async () => {
        // 1. Create a Test Service
        const { data: service, error: svcError } = await supabase
            .from('session_types')
            .insert({
                title: 'Cancellation Test',
                category: 'CLASS',
                description: 'E2E Cancel Test Service',
                image_url: 'https://placehold.co/400'
            })
            .select()
            .single();

        if (svcError) throw new Error(`Setup Failed (Service): ${svcError.message}`);
        testServiceId = service.id;

        // 2. Create a Future Session (Today + 3h)
        const today = new Date();
        today.setHours(today.getHours() + 3);
        today.setMinutes(0, 0, 0);

        const endTime = new Date(today);
        endTime.setHours(today.getHours() + 1);

        const { data: session, error: sessError } = await supabase
            .from('sessions')
            .insert({
                title: testSessionTitle,
                description: 'E2E Cancel Session',
                start_time: today.toISOString(),
                end_time: endTime.toISOString(),
                category: 'CLASS',
                session_type_id: testServiceId,
                instructor: 'Coach Cancel',
                total_facility_bays: 1,
                max_capacity: 5,
                credit_cost: 10
            })
            .select()
            .single();

        if (sessError) throw new Error(`Setup Failed (Session): ${sessError.message}`);
        testSessionId = session.id;
    });

    test.afterAll(async () => {
        // Cleanup
        if (testSessionId) await supabase.from('sessions').delete().eq('id', testSessionId);
        if (testServiceId) await supabase.from('session_types').delete().eq('id', testServiceId);
    });

    test('should allow user to cancel a booked session and get refund', async ({ page }) => {
        // Monitor Console
        page.on('console', msg => {
            console.log(`[BROWSER]: ${msg.text()}`);
        });

        // 1. Identification: Who am I?
        // Reuse cookie parsing logic
        try {
            const authStatePath = 'playwright/.auth/user.json';
            if (!fs.existsSync(authStatePath)) {
                throw new Error(`Auth state file not found at ${authStatePath}. Run auth.setup.ts first.`);
            }

            const authState = JSON.parse(fs.readFileSync(authStatePath, 'utf-8'));
            const authCookie = authState.cookies.find((c: any) => c.name.includes('-auth-token'));
            if (!authCookie) throw new Error("Supabase auth cookie not found");

            let cookieValue = authCookie.value;
            if (cookieValue.startsWith('base64-')) {
                cookieValue = Buffer.from(cookieValue.replace('base64-', ''), 'base64').toString('utf-8');
            } else if (cookieValue.includes('%')) {
                cookieValue = decodeURIComponent(cookieValue);
            }
            const sessionData = JSON.parse(cookieValue);
            parentId = sessionData.user.id;
        } catch (e: any) {
            console.error('[SETUP ERROR] Failed to read auth state:', e);
            throw e;
        }

        console.log(`[TEST] User ID: ${parentId}`);

        // 2. Pre-condition: Book the session manually in DB
        // Set Credits to 90 (simulating 10 spent)
        await supabase.from('profiles').update({ credits: 90 }).eq('id', parentId);

        // Clean any existing reg just in case
        await supabase.from('registrations').delete().eq('user_id', parentId).eq('session_id', testSessionId);

        const { error: bookError } = await supabase.from('registrations').insert({
            user_id: parentId,
            session_id: testSessionId,
            payer_id: parentId
        });

        if (bookError) throw new Error(`Manual Booking Failed: ${bookError.message}`);
        console.log('[SETUP] Manually booked session for user.');

        // 3. Navigate to Schedule
        // Using ?tab=schedule to force schedule view
        await page.goto('/?tab=schedule');

        // Wait for Schedule Header
        await expect(page.locator('h2:has-text("My Schedule")')).toBeVisible();

        // 4. Find Session Card
        // Locating by text since the container is a div
        const sessionCard = page.locator(`text="${testSessionTitle}"`).first();
        await expect(sessionCard).toBeVisible({ timeout: 10000 });

        // Check container for PAID status if possible (text might be separate)
        // We can just trust that if it's there, it's the one we booked.

        // 5. Open Modal
        await sessionCard.click();
        await page.waitForTimeout(500);

        // 6. Verify Cancel Button Visibility
        const cancelButton = page.locator('button:has-text("CANCEL SELECTION")');
        await expect(cancelButton).toBeVisible();

        // 7. Handle Confirmation Dialog
        page.once('dialog', async dialog => {
            console.log(`[DIALOG] ${dialog.message()}`);
            await dialog.accept();
        });

        // 8. Click Cancel Selection
        await cancelButton.click();

        // 9. Handle Penalty Warning Modal
        // Expect "Cancellation Policy" header
        const warningHeader = page.locator('text="Cancellation Policy"');
        await expect(warningHeader).toBeVisible();

        // Click "Yes, Cancel Session"
        const confirmButton = page.locator('button:has-text("Yes, Cancel Session")');
        await expect(confirmButton).toBeVisible();
        await confirmButton.click();

        // 10. Wait for Processing
        // The confirm button text changes to "..." 
        // Then the modal should close
        await expect(warningHeader).not.toBeVisible({ timeout: 10000 });

        // Ensure Modal is actually gone (to verify success vs error state)
        // If error occurred, modal might stay open with CANCELLING... gone.
        // But we added alert handling, so modal might close or stay.
        // Assuming success path:
        const modalHeader = page.locator(`h2:has-text("${testSessionTitle}")`);
        await expect(modalHeader).not.toBeVisible();

        // 10. Verify DB State
        // Registration should be gone
        const { data: regCheck } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', parentId)
            .eq('session_id', testSessionId)
            .maybeSingle();

        if (regCheck) throw new Error("Registration still exists in DB after cancellation.");
        console.log('[VERIFIED] Registration deleted.');

        // Credits should be refunded (90 -> 100)
        // Wait a moment for RPC to finish update
        await page.waitForTimeout(1000);
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', parentId).single();

        if (profile?.credits !== 100) {
            throw new Error(`Refund failed. Expected 100 credits, got ${profile?.credits}`);
        }
        console.log('[VERIFIED] Credits refunded to 100.');
    });
});
