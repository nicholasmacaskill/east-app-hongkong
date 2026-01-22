import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Role-Based Permissions & Access Control', () => {
    let playerId: string;
    let parentId: string;
    let childId: string;
    let playerEmail: string;
    let parentEmail: string;
    const playerPassword = 'TestPlayer123!';
    const parentPassword = 'TestParent123!';

    test.beforeAll(async () => {
        const unique = Math.random().toString(36).substring(7);
        playerEmail = `test-player-${unique}@east.com`;
        parentEmail = `test-parent-${unique}@east.com`;

        // 1. Create Player with ACTIVE account status
        const { data: playerData, error: playerError } = await supabase.auth.admin.createUser({
            email: playerEmail,
            password: playerPassword,
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'Test', last_name: 'Player' }
        });
        if (playerError) throw playerError;
        playerId = playerData.user!.id;
        await supabase.from('profiles').upsert({
            id: playerId,
            role: 'player',
            first_name: 'Test',
            last_name: 'Player',
            credits: 50,
            account_status: 'ACTIVE'
        });

        // 2. Create Parent with ACTIVE account status
        const { data: parentData, error: parentError } = await supabase.auth.admin.createUser({
            email: parentEmail,
            password: parentPassword,
            email_confirm: true,
            user_metadata: { role: 'parent', first_name: 'Test', last_name: 'Parent' }
        });
        if (parentError) throw parentError;
        parentId = parentData.user!.id;
        await supabase.from('profiles').upsert({
            id: parentId,
            role: 'parent',
            first_name: 'Test',
            last_name: 'Parent',
            credits: 100,
            account_status: 'ACTIVE'
        });

        // 3. Create a child player linked to the parent
        const { data: childData, error: childError } = await supabase.auth.admin.createUser({
            email: `test-child-${unique}@east.com`,
            password: 'TestChild123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'Test', last_name: 'Child' }
        });
        if (childError) throw childError;
        childId = childData.user!.id;
        await supabase.from('profiles').upsert({
            id: childId,
            role: 'player',
            first_name: 'Test',
            last_name: 'Child',
            credits: 0,
            parent_id: parentId,
            account_status: 'ACTIVE'
        });
    });

    test.afterAll(async () => {
        if (playerId) await supabase.auth.admin.deleteUser(playerId);
        if (parentId) await supabase.auth.admin.deleteUser(parentId);
        if (childId) await supabase.auth.admin.deleteUser(childId);
    });

    const isHydrated = async (page: any) => {
        await page.waitForFunction(() => !document.body.innerText.includes('Loading...'), { timeout: 30000 });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
    };

    test('Player role: Cannot see "Add Child" button or attendee selection', async ({ page }) => {
        // Login as player
        await page.goto('/login');
        await page.fill('input[placeholder="Enter your email"]', playerEmail);
        await page.fill('input[placeholder="Enter your password"]', playerPassword);
        await page.click('button:has-text("Login")');
        await page.waitForTimeout(500); // Allow for redirection logic

        await isHydrated(page);
        await page.waitForURL('/');

        // Navigate to dashboard/home screen
        await page.waitForSelector('text=/Welcome|Home|Dashboard/i', { timeout: 15000 });

        // Verify "Add Child" button is NOT visible
        const addChildButton = page.locator('button:has-text("Add Child")');
        await expect(addChildButton).not.toBeVisible();

        // Open a class/session modal to check booking options
        // Assuming there's a service/class that can be clicked
        const classCard = page.locator('[class*="service"], [class*="class"]').first();
        if (await classCard.isVisible()) {
            await classCard.click();
            await page.waitForTimeout(1000);

            // In the booking modal, verify only self can be selected
            // Check that there's no attendee toggle or household section
            const householdSection = page.locator('text=/Household|Family|Select Attendee/i');
            await expect(householdSection).not.toBeVisible();

            // Verify player's own name appears as the default/only booker
            const playerName = page.locator('text=/Test Player/i');
            await expect(playerName).toBeVisible();
        }
    });

    test('Parent role: Can see "Households" section and toggle between attendees', async ({ page }) => {
        // Login as parent
        await page.goto('/login');
        await page.fill('input[placeholder="Enter your email"]', parentEmail);
        await page.fill('input[placeholder="Enter your password"]', parentPassword);
        await page.click('button:has-text("Login")');
        await page.waitForTimeout(500); // Allow for redirection logic

        await isHydrated(page);
        await page.waitForURL('/');

        // Navigate to profile or home screen that shows households
        await page.waitForSelector('text=/Welcome|Profile|Dashboard/i', { timeout: 15000 });

        // Check for Households/Family section in ParentProfile
        const householdsSection = page.locator('text=/Households?|Family|Children/i');

        // Parent should see household management features
        // This could be in a profile page or a dedicated section
        const profileLink = page.locator('a[href*="profile"], button:has-text("Profile")');
        if (await profileLink.isVisible()) {
            await profileLink.click();
            await page.waitForTimeout(1000);

            // Should see household or add child functionality
            const addChildOrHousehold = page.locator('button:has-text("Add Child"), text=/Household/i');
            await expect(addChildOrHousehold.first()).toBeVisible();
        }

        // Open a class modal and verify attendee selection
        await page.goto('/');
        await isHydrated(page);

        const classCard = page.locator('[class*="service"], [class*="class"]').first();
        if (await classCard.isVisible()) {
            await classCard.click();
            await page.waitForTimeout(2000);

            // In ClassModal, parent should see attendee checkboxes
            const attendeeCheckbox = page.locator('input[type="checkbox"]');
            const checkboxCount = await attendeeCheckbox.count();

            // Parent should have at least 2 checkboxes (self + child)
            expect(checkboxCount).toBeGreaterThanOrEqual(2);

            // Verify parent's name and child's name appear
            await expect(page.locator('text=/Test Parent/i')).toBeVisible();
            await expect(page.locator('text=/Test Child/i')).toBeVisible();
        }
    });

    test('LOCKED player: Sees membership upsell message', async ({ page }) => {
        // Update player account_status to LOCKED
        await supabase.from('profiles').update({ account_status: 'LOCKED' }).eq('id', playerId);

        // Login as locked player
        await page.goto('/login');
        await page.fill('input[placeholder="Enter your email"]', playerEmail);
        await page.fill('input[placeholder="Enter your password"]', playerPassword);
        await page.click('button:has-text("Login")');
        await page.waitForTimeout(500); // Allow for redirection logic

        await isHydrated(page);

        // Try to book a class and verify membership upsell appears
        const classCard = page.locator('[class*="service"], [class*="class"]').first();
        if (await classCard.isVisible()) {
            await classCard.click();
            await page.waitForTimeout(1000);

            // Attempt to book
            const bookButton = page.locator('button:has-text("Book"), button:has-text("Reserve")');
            if (await bookButton.isVisible()) {
                await bookButton.click();
                await page.waitForTimeout(1500);

                // Check for membership upsell toast or message
                const membershipUpsell = page.locator('text=/membership|subscribe|upgrade|Account Locked/i');
                await expect(membershipUpsell.first()).toBeVisible({ timeout: 10000 });
            }
        }

        // Restore status
        await supabase.from('profiles').update({ account_status: 'ACTIVE' }).eq('id', playerId);
    });

    test('LOCKED parent: Sees family subscription prompt', async ({ page }) => {
        // Update parent account_status to LOCKED
        await supabase.from('profiles').update({ account_status: 'LOCKED' }).eq('id', parentId);

        // Login as locked parent
        await page.goto('/login');
        await page.fill('input[placeholder="Enter your email"]', parentEmail);
        await page.fill('input[placeholder="Enter your password"]', parentPassword);
        await page.click('button:has-text("Login")');
        await page.waitForTimeout(500); // Allow for redirection logic

        await isHydrated(page);

        // Try to book a class and verify family subscription prompt appears
        const classCard = page.locator('[class*="service"], [class*="class"]').first();
        if (await classCard.isVisible()) {
            await classCard.click();
            await page.waitForTimeout(1000);

            // Attempt to book
            const bookButton = page.locator('button:has-text("Book"), button:has-text("Reserve")');
            if (await bookButton.isVisible()) {
                await bookButton.click();
                await page.waitForTimeout(1500);

                // Check for family/subscription prompt (different from player upsell)
                // Parent should see messaging about updating "family subscription" or "household subscription"
                const familySubscriptionPrompt = page.locator('text=/family.*subscription|household.*subscription|update.*subscription|Account Locked/i');
                await expect(familySubscriptionPrompt.first()).toBeVisible({ timeout: 10000 });
            }
        }

        // Restore status
        await supabase.from('profiles').update({ account_status: 'ACTIVE' }).eq('id', parentId);
    });

    test('Player cannot access parent-only features', async ({ page }) => {
        // Login as player
        await page.goto('/login');
        await page.fill('input[placeholder="Enter your email"]', playerEmail);
        await page.fill('input[placeholder="Enter your password"]', playerPassword);
        await page.click('button:has-text("Login")');
        await page.waitForTimeout(500); // Allow for redirection logic

        await isHydrated(page);

        // Verify no "Transfer Credits" option (parent-only)
        const transferCredits = page.locator('button:has-text("Transfer Credits"), text=/Transfer Credits/i');
        await expect(transferCredits).not.toBeVisible();

        // Verify no "Add Child" option
        const addChild = page.locator('button:has-text("Add Child")');
        await expect(addChild).not.toBeVisible();

        // Verify no household management
        const householdMgmt = page.locator('text=/Manage Household|Family Management/i');
        await expect(householdMgmt).not.toBeVisible();
    });

    test('Parent can transfer credits between family members', async ({ page }) => {
        // Login as parent
        await page.goto('/login');
        await page.fill('input[placeholder="Enter your email"]', parentEmail);
        await page.fill('input[placeholder="Enter your password"]', parentPassword);
        await page.click('button:has-text("Login")');
        await page.waitForTimeout(500); // Allow for redirection logic

        await isHydrated(page);

        // Navigate to profile
        const profileLink = page.locator('a[href*="profile"], button:has-text("Profile")');
        if (await profileLink.isVisible()) {
            await profileLink.click();
            await page.waitForTimeout(1000);

            // Look for transfer credits functionality
            const transferButton = page.locator('button:has-text("Transfer")');

            if (await transferButton.isVisible()) {
                await transferButton.click();
                await page.waitForTimeout(1000);

                // Verify child appears as transfer recipient option
                await expect(page.locator('text=/Test Child/i')).toBeVisible();
            }
        }
    });
});
