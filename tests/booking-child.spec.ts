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

test.describe('Child Booking Flow', () => {
    let testServiceId: string;
    let testSessionId: number;
    let parentId: string;
    let childId: string;

    test.beforeAll(async () => {
        // 1. Create a Test Service (Class Type)
        const { data: service, error: svcError } = await supabase
            .from('session_types')
            .insert({
                title: 'Child Booking Test',
                category: 'CLASS',
                description: 'E2E Child Test Service',
                image_url: 'https://placehold.co/400'
            })
            .select()
            .single();

        if (svcError) throw new Error(`Setup Failed (Service): ${svcError.message}`);
        testServiceId = service.id;

        // 2. Create a Future Session (Today + 2h)
        const today = new Date();
        today.setHours(today.getHours() + 2);
        today.setMinutes(0, 0, 0);

        const endTime = new Date(today);
        endTime.setHours(today.getHours() + 1);

        const { data: session, error: sessError } = await supabase
            .from('sessions')
            .insert({
                title: 'Child Booking Test',
                description: 'E2E Child Session',
                start_time: today.toISOString(),
                end_time: endTime.toISOString(),
                category: 'CLASS',
                session_type_id: testServiceId,
                instructor: 'Coach Kid',
                total_facility_bays: 1,
                max_capacity: 5,
                credit_cost: 10 // Higher cost to verify deduction
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
        if (childId) {
            await supabase.from('profiles').delete().eq('id', childId);
            await supabase.auth.admin.deleteUser(childId);
        }
    });

    test('should allow parent to book for a child', async ({ page }) => {
        // Monitor Console
        page.on('console', msg => {
            if (msg.type() === 'error') console.log(`[BROWSER ERROR]: ${msg.text()}`);
        });

        // 1. Identification: Who am I?
        try {
            const authStatePath = 'playwright/.auth/user.json';
            if (!fs.existsSync(authStatePath)) {
                throw new Error(`Auth state file not found at ${authStatePath}. Run auth.setup.ts first.`);
            }

            const authState = JSON.parse(fs.readFileSync(authStatePath, 'utf-8'));

            // Find Supabase Auth Cookie
            const authCookie = authState.cookies.find((c: any) => c.name.includes('-auth-token'));
            if (!authCookie) throw new Error("Supabase auth cookie not found");

            // Value is often "base64-<encoded-json>" or just JSON string
            let cookieValue = authCookie.value;
            if (cookieValue.startsWith('base64-')) {
                const base64Str = cookieValue.replace('base64-', '');
                cookieValue = Buffer.from(base64Str, 'base64').toString('utf-8');
            } else if (cookieValue.includes('%')) {
                cookieValue = decodeURIComponent(cookieValue);
            }

            const sessionData = JSON.parse(cookieValue);
            parentId = sessionData.user.id;
            console.log(`[TEST] Found Parent ID from Auth Cookie: ${parentId}`);

        } catch (e: any) {
            console.error('[SETUP ERROR] Failed to read auth state:', e);
            throw e;
        }

        // 2. Login (Browsing to page uses cookies/storage from context)
        await page.goto('/');

        // Wait for Home Screen
        await expect(page.locator('h2:has-text("Breaking News")')).toBeVisible();

        // 3. Create Child for this Parent
        // Generate random child
        const childName = `Kid_${Math.floor(Math.random() * 1000)}`;
        const childEmail = `test-child-${Math.floor(Math.random() * 10000)}@example.com`;

        const { data: childAuth, error: childAuthError } = await supabase.auth.admin.createUser({
            email: childEmail,
            email_confirm: true,
            user_metadata: { first_name: childName, last_name: 'Test' }
        });

        if (childAuthError) throw new Error(`Child Auth Failed: ${childAuthError.message}`);
        childId = childAuth.user.id;

        // Link in Profiles
        await supabase.from('profiles').upsert({
            id: childId,
            first_name: childName,
            last_name: 'Test',
            role: 'player',
            parent_id: parentId, // LINK TO PARENT
            credits: 0
        });

        // Link in Relationships (Just in case)
        await supabase.from('player_relationships').insert({
            parent_id: parentId,
            child_id: childId
        });

        console.log(`[SETUP] Created Child ${childName} (${childId}) for Parent ${parentId}`);

        // RELOAD page to fetch new children
        await page.reload();
        await expect(page.locator('h2:has-text("Breaking News")')).toBeVisible();

        // 4. Find Service and Book
        const serviceCard = page.locator(`text=Child Booking Test`).first();
        await expect(serviceCard).toBeVisible();
        await serviceCard.click();

        // 5. Modal Interaction
        await page.waitForTimeout(1000);
        await expect(page.locator('h2', { hasText: /Child Booking Test/i }).first()).toBeVisible();

        // Check if Child appears in the list
        const childButton = page.locator(`button:has-text("${childName}")`);
        await expect(childButton).toBeVisible();

        // Deselect Myself if selected
        const myselfButton = page.locator('button:has-text("Myself")');
        if (await myselfButton.count() > 0) {
            const isSelected = await myselfButton.evaluate(el => el.classList.contains('bg-black'));
            if (isSelected) {
                await myselfButton.click();
            }
        }

        // Select Child
        await childButton.click();

        // 6. Pay
        await page.click('button:has-text("PAY 10 CREDITS")');

        // Wait for processing
        await page.waitForTimeout(3000);

        // 7. Verification
        // Check Registration in DB
        // Schema Note: registrations table uses 'user_id' for the attendee and 'payer_id' for the payer.
        const { data: reg, error: regError } = await supabase
            .from('registrations')
            .select('*')
            .eq('session_id', testSessionId)
            .eq('user_id', childId) // User ID is the attendee
            .single();

        if (regError || !reg) {
            throw new Error(`Booking Verification Failed: Registration for child not found. ${regError?.message || ''}`);
        }

        // Verify Payer
        if (reg.payer_id !== parentId) {
            throw new Error(`Booking Verification Failed: Payer ID mismatch. Expected ${parentId}, got ${reg.payer_id}`);
        }

        console.log('[VERIFIED] Registration exists for child (user_id) and paid by parent (payer_id).');

        // 8. Verify UI Update
        await expect(page.locator('h2', { hasText: /Child Booking Test/i })).not.toBeVisible();
    });
});
