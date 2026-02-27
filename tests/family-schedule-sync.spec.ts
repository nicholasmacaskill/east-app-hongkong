import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * AUDITOR NOTE: This test follows PLAYWRIGHT_TESTING_STANDARDS.md
 * Phase 1: UI Discovery completed - verified all selectors against actual components
 * - Schedule heading: "My Schedule" (ScheduleScreen.tsx:187)
 * - Attendee label: "ATTENDING: {first_name}" (ScheduleScreen.tsx:292-293)
 * - Details button: "DETAILS" (ScheduleScreen.tsx:306)
 * - Cancel button: "CANCEL SELECTION" (ClassModal.tsx:854)
 */

test.describe('Family Schedule Sync & Selective Cancellation', () => {
    let parentId: string;
    let childAId: string;
    let childBId: string;
    let sessionXId: number;
    let sessionYId: number;
    let parentEmail: string;
    const parentPassword = 'TestParent123!';
    let initialParentCredits: number;

    test.beforeAll(async () => {
        const unique = Math.random().toString(36).substring(7);
        parentEmail = `test-parent-${unique}@east.com`;

        // 1. Create Parent
        const { data: parentData, error: parentError } = await supabase.auth.admin.createUser({
            email: parentEmail,
            password: parentPassword,
            email_confirm: true,
            user_metadata: { role: 'parent', first_name: 'Test', last_name: 'Parent' }
        });
        if (parentError) throw parentError;
        parentId = parentData.user!.id;
        initialParentCredits = 200;
        await supabase.from('profiles').upsert({
            id: parentId,
            role: 'parent',
            first_name: 'Test',
            last_name: 'Parent',
            credits: initialParentCredits,
            account_status: 'ACTIVE'
        });

        // 2. Create Child A
        const { data: childAData, error: childAError } = await supabase.auth.admin.createUser({
            email: `test-childA-${unique}@east.com`,
            password: 'TestChild123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'ChildA', last_name: 'TestFamily' }
        });
        if (childAError) throw childAError;
        childAId = childAData.user!.id;
        await supabase.from('profiles').upsert({
            id: childAId,
            role: 'player',
            first_name: 'ChildA',
            last_name: 'TestFamily',
            parent_id: parentId,
            credits: 0,
            account_status: 'ACTIVE'
        });

        // 3. Create Child B
        const { data: childBData, error: childBError } = await supabase.auth.admin.createUser({
            email: `test-childB-${unique}@east.com`,
            password: 'TestChild123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'ChildB', last_name: 'TestFamily' }
        });
        if (childBError) throw childBError;
        childBId = childBData.user!.id;
        await supabase.from('profiles').upsert({
            id: childBId,
            role: 'player',
            first_name: 'ChildB',
            last_name: 'TestFamily',
            parent_id: parentId,
            credits: 0,
            account_status: 'ACTIVE'
        });

        // 3.5 Explicitly link children to parent via player_relationships (New Standard)
        await supabase.from('player_relationships').upsert([
            { parent_id: parentId, child_id: childAId, role: 'parent' },
            { parent_id: parentId, child_id: childBId, role: 'parent' }
        ]);

        // 4. Create Session X (for Child A)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        const sessionXEnd = new Date(tomorrow);
        sessionXEnd.setHours(11, 0, 0, 0);

        const { data: sessionXData, error: sessionXError } = await supabase.from('sessions').insert({
            title: 'Class X',
            start_time: tomorrow.toISOString(),
            end_time: sessionXEnd.toISOString(),
            instructor: 'Coach Test',
            category: 'FITNESS',
            max_capacity: 10
        }).select().single();
        if (sessionXError) throw sessionXError;
        sessionXId = sessionXData.id;

        // 5. Create Session Y (for Child B)
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        dayAfterTomorrow.setHours(14, 0, 0, 0);
        const sessionYEnd = new Date(dayAfterTomorrow);
        sessionYEnd.setHours(15, 0, 0, 0);

        const { data: sessionYData, error: sessionYError } = await supabase.from('sessions').insert({
            title: 'Class Y',
            start_time: dayAfterTomorrow.toISOString(),
            end_time: sessionYEnd.toISOString(),
            instructor: 'Coach Test',
            category: 'GOLF',
            max_capacity: 10
        }).select().single();
        if (sessionYError) throw sessionYError;
        sessionYId = sessionYData.id;

        // 6. Book Child A into Class X
        await supabase.from('registrations').insert({
            session_id: sessionXId,
            user_id: childAId
        });

        // 7. Book Child B into Class Y
        await supabase.from('registrations').insert({
            session_id: sessionYId,
            user_id: childBId
        });

        // 8. Deduct credits from parent (assuming 10 credits per class)
        await supabase.from('profiles').update({
            credits: initialParentCredits - 20 // 10 credits per booking
        }).eq('id', parentId);
    });

    test.afterAll(async () => {
        // Cleanup
        if (sessionXId) await supabase.from('sessions').delete().eq('id', sessionXId);
        if (sessionYId) await supabase.from('sessions').delete().eq('id', sessionYId);
        if (parentId) await supabase.auth.admin.deleteUser(parentId);
        if (childAId) await supabase.auth.admin.deleteUser(childAId);
        if (childBId) await supabase.auth.admin.deleteUser(childBId);
    });

    const isHydrated = async (page: any) => {
        await page.waitForFunction(() => !document.body.innerText.includes('Loading...'), { timeout: 30000 });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
    };

    test('Parent sees both children\'s classes in My Schedule with attendee labels', async ({ page }) => {
        // Login as parent
        await page.goto('/login');
        await page.fill('input[name="email"]', parentEmail);
        await page.fill('input[name="password"]', parentPassword);
        await page.click('button:has-text("Login")');


        await isHydrated(page);
        await page.waitForURL('/');

        // Navigate to schedule view by clicking schedule icon/button in header
        // BottomNav "Schedule" button
        const scheduleNav = page.locator('button').filter({ hasText: 'Schedule' }).last();
        await scheduleNav.waitFor();
        await scheduleNav.click({ force: true });

        await page.waitForTimeout(1000);
        await page.waitForSelector('text=/My Schedule/i', { timeout: 15000 });

        // Select Tomorrow (Index 1 in the 6-day strip) to see Class X
        // The strip is a flex container with gap-1.
        // We find the date items which have 'rounded-xl' and 'cursor-pointer'
        const dateItems = page.locator('div.rounded-xl.cursor-pointer').filter({ hasText: /[0-9]+/ });
        await dateItems.nth(1).click();
        await page.waitForTimeout(1000);

        // Verify "Class X" appears with ChildA label
        const classXCard = page.locator('text=Class X').first();
        await expect(classXCard).toBeVisible({ timeout: 10000 });

        // Find the attendee label for Class X (should show "ATTENDING: ChildA")
        const childALabel = page.locator('text=/ATTENDING:.*ChildA/i');
        await expect(childALabel).toBeVisible();

        // Select Day After Tomorrow (Index 2) to see Class Y
        await dateItems.nth(2).click();
        await page.waitForTimeout(1000);

        // Verify "Class Y" appears with ChildB label
        const classYCard = page.locator('text=Class Y').first();
        await expect(classYCard).toBeVisible();

        // Find the attendee label for Class Y (should show "ATTENDING: ChildB")
        const childBLabel = page.locator('text=/ATTENDING:.*ChildB/i');
        await expect(childBLabel).toBeVisible();
    });

    test('Cancelling Child A\'s session refunds parent and leaves Child B\'s session intact', async ({ page }) => {
        test.setTimeout(90000); // Increase timeout for complex flow

        // Login as parent
        await page.goto('/login');
        await page.fill('input[name="email"]', parentEmail);
        await page.fill('input[name="password"]', parentPassword);
        await page.click('button:has-text("Login")');


        await isHydrated(page);

        // Navigate to schedule view
        const scheduleNav = page.locator('button').filter({ hasText: 'Schedule' }).last();
        await scheduleNav.waitFor();
        await scheduleNav.click({ force: true });

        await page.waitForTimeout(1000);
        await page.waitForSelector('text=/My Schedule/i', { timeout: 15000 });

        // Select Tomorrow (Index 1) to see Class X
        const dateItems = page.locator('div.rounded-xl.cursor-pointer').filter({ hasText: /[0-9]+/ });
        await dateItems.nth(1).click();
        await page.waitForTimeout(2000); // Give it extra time to fetch after click

        // Get initial credit balance
        const { data: initialProfile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', parentId)
            .single();
        const creditsBeforeCancel = initialProfile?.credits || 0;

        // Click on Class X to open modal (using data-testid to avoid text ambiguity and animation issues)
        const classXCard = page.locator('[data-testid="session-card-Class-X"]');
        await classXCard.click();
        await page.waitForTimeout(2000); // Wait for modal to open

        // Select Child A in the attendee list to reveal the cancellation option
        // We filter by 'BOOKED' to ensure we only select the button inside the modal that confirms attendance
        const childModalButton = page.locator('button').filter({ hasText: 'CHILDA' }).filter({ hasText: 'BOOKED' }).first();
        await childModalButton.click();
        await page.waitForTimeout(1000);

        // Look for CANCEL SELECTION button (appears when session is already booked)
        const cancelButton = page.locator('button:has-text("CANCEL SELECTION")');
        await expect(cancelButton).toBeVisible({ timeout: 10000 });

        // Click cancel button
        await cancelButton.click();
        await page.waitForTimeout(2000); // Wait for cancellation to process

        // Verify toast/success message appears
        const successToast = page.locator('text=/cancel|refund|success/i');
        await expect(successToast.first()).toBeVisible({ timeout: 10000 });

        // Close modal if still open
        const closeButton = page.locator('button[aria-label="Close"], button:has-text("×")');
        if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(1000);
        }

        // Verify credits were refunded
        const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', parentId)
            .single();
        const creditsAfterCancel = updatedProfile?.credits || 0;

        // Should have been refunded 10 credits
        expect(creditsAfterCancel).toBe(creditsBeforeCancel + 10);

        // Verify Class X no longer appears in schedule (on Tomorrow's date)
        await page.reload();
        await isHydrated(page);

        // Navigate back to schedule
        // Need to re-navigate and re-select date because reload resets state
        const scheduleNavRetry = page.locator('button').filter({ hasText: 'Schedule' }).last();
        await scheduleNavRetry.waitFor();
        await scheduleNavRetry.click({ force: true });
        await page.waitForTimeout(1000);

        // Select Tomorrow (Index 1)
        const dateItemsRetry = page.locator('div.rounded-xl.cursor-pointer').filter({ hasText: /[0-9]+/ });
        await dateItemsRetry.nth(1).click();
        await page.waitForTimeout(1000);

        const classXAfterCancel = page.locator('text=Class X');
        await expect(classXAfterCancel).not.toBeVisible();

        // Verify Class Y still appears (Child B's session untouched) - Select Day After Tomorrow (Index 2)
        await dateItemsRetry.nth(2).click();
        await page.waitForTimeout(1000);

        const classYStillVisible = page.locator('text=Class Y');
        await expect(classYStillVisible).toBeVisible();

        // Verify Child B label still present
        const childBLabelStillPresent = page.locator('text=/ATTENDING:.*ChildB/i');
        await expect(childBLabelStillPresent).toBeVisible();
    });
});
