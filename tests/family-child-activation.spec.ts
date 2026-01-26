import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * FAMILY MEMBERSHIP CHILD ACTIVATION TEST
 * 
 * Verifies that when a parent purchases a family membership plan,
 * all associated children are automatically activated.
 * 
 * Test Flow:
 * 1. Create parent account
 * 2. Create child account
 * 3. Link child to parent (via parent_id)
 * 4. Purchase family membership as parent
 * 5. Verify child's account is activated
 */

test.describe('Family Membership Child Activation', () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    let supabaseAdmin: ReturnType<typeof createClient>;
    let parentId: string;
    let childId: string;
    let parentEmail: string;
    let childEmail: string;

    test.beforeAll(() => {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    });

    test('should activate child account when parent purchases family membership', async ({ page }) => {
        // Generate unique emails
        const timestamp = Date.now();
        parentEmail = `parent-test-${timestamp}@example.com`;
        childEmail = `child-test-${timestamp}@example.com`;
        const password = 'TestPassword123!';

        // ========================================
        // STEP 1: Create Parent Account
        // ========================================
        await test.step('Create parent account', async () => {
            await page.goto('/login');

            // Switch to signup (assuming there's a signup link/tab)
            await page.click('text=Sign Up');

            await page.fill('input[name="email"], input[type="email"]', parentEmail);
            await page.fill('input[name="password"], input[type="password"]', password);
            await page.click('button[type="submit"]');

            // Wait for successful login/redirect
            await page.waitForURL('/', { timeout: 10000 });

            // Get parent user ID from Supabase
            const { data: { user } } = await supabaseAdmin.auth.admin.getUserByEmail(parentEmail);
            expect(user).toBeTruthy();
            parentId = user!.id;

            // Update parent role to 'parent'
            await supabaseAdmin
                .from('profiles')
                .update({ role: 'parent' })
                .eq('id', parentId);

            console.log(`✅ Created parent: ${parentEmail} (${parentId})`);
        });

        // ========================================
        // STEP 2: Create Child Account
        // ========================================
        await test.step('Create child account', async () => {
            // Logout parent
            await page.goto('/');
            await page.click('button:has-text("Logout"), a:has-text("Logout")');
            await page.waitForURL('/login');

            // Create child account
            await page.click('text=Sign Up');
            await page.fill('input[name="email"], input[type="email"]', childEmail);
            await page.fill('input[name="password"], input[type="password"]', password);
            await page.click('button[type="submit"]');

            await page.waitForURL('/', { timeout: 10000 });

            // Get child user ID
            const { data: { user } } = await supabaseAdmin.auth.admin.getUserByEmail(childEmail);
            expect(user).toBeTruthy();
            childId = user!.id;

            // Update child role to 'player'
            await supabaseAdmin
                .from('profiles')
                .update({ role: 'player' })
                .eq('id', childId);

            console.log(`✅ Created child: ${childEmail} (${childId})`);
        });

        // ========================================
        // STEP 3: Link Child to Parent
        // ========================================
        await test.step('Link child to parent', async () => {
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({ parent_id: parentId })
                .eq('id', childId);

            expect(error).toBeNull();

            console.log(`✅ Linked child ${childId} to parent ${parentId}`);
        });

        // ========================================
        // STEP 4: Verify Child is Initially Locked
        // ========================================
        await test.step('Verify child is initially locked', async () => {
            const { data: childProfile } = await supabaseAdmin
                .from('profiles')
                .select('subscription_status, account_status')
                .eq('id', childId)
                .single();

            expect(childProfile?.subscription_status).not.toBe('active');
            console.log(`✅ Child initially locked (status: ${childProfile?.subscription_status})`);
        });

        // ========================================
        // STEP 5: Login as Parent and Purchase Family Plan
        // ========================================
        await test.step('Purchase family membership as parent', async () => {
            // Logout child
            await page.goto('/');
            await page.click('button:has-text("Logout"), a:has-text("Logout")');
            await page.waitForURL('/login');

            // Login as parent
            await page.fill('input[name="email"], input[type="email"]', parentEmail);
            await page.fill('input[name="password"], input[type="password"]', password);
            await page.click('button[type="submit"]');
            await page.waitForURL('/');

            // Navigate to membership page
            await page.goto('/membership');
            await page.waitForLoadState('networkidle');

            // Select Family plan
            const familyButton = page.locator('button:has-text("family"), button:has-text("Family")').first();
            if (await familyButton.isVisible()) {
                await familyButton.click();
            }

            // Select 1 member (or 2 if there's a selector)
            const memberSelector = page.locator('button:has-text("1"), button[data-members="1"]').first();
            if (await memberSelector.isVisible()) {
                await memberSelector.click();
            }

            // Click purchase button
            const purchaseButton = page.locator('button:has-text("ACTIVATE"), button:has-text("Purchase")').first();
            await purchaseButton.click();

            // Wait for Stripe checkout redirect
            await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });

            // Fill in Stripe test card
            await page.fill('[name="cardnumber"]', '4242424242424242');
            await page.fill('[name="exp-date"]', '12/34');
            await page.fill('[name="cvc"]', '123');
            await page.fill('[name="billingPostalCode"]', '12345');

            // Submit payment
            await page.click('button[type="submit"]');

            // Wait for redirect back to app with success
            await page.waitForURL(/success=true/, { timeout: 30000 });

            console.log(`✅ Family membership purchased`);
        });

        // ========================================
        // STEP 6: Verify Child is Now Active
        // ========================================
        await test.step('Verify child account is activated', async () => {
            // Wait a moment for webhook to process
            await page.waitForTimeout(5000);

            const { data: childProfile } = await supabaseAdmin
                .from('profiles')
                .select('subscription_status, account_status, membership_expires, membership_start')
                .eq('id', childId)
                .single();

            // Assertions
            expect(childProfile?.subscription_status).toBe('active');
            expect(childProfile?.account_status).toBe('active');
            expect(childProfile?.membership_expires).toBeTruthy();
            expect(childProfile?.membership_start).toBeTruthy();

            console.log(`✅ Child account activated!`);
            console.log(`   - subscription_status: ${childProfile?.subscription_status}`);
            console.log(`   - account_status: ${childProfile?.account_status}`);
            console.log(`   - membership_expires: ${childProfile?.membership_expires}`);
        });

        // ========================================
        // STEP 7: Verify Parent Also Active
        // ========================================
        await test.step('Verify parent account is also active', async () => {
            const { data: parentProfile } = await supabaseAdmin
                .from('profiles')
                .select('subscription_status, tier, credits')
                .eq('id', parentId)
                .single();

            expect(parentProfile?.subscription_status).toBe('active');
            expect(parentProfile?.tier).toContain('family');
            expect(parentProfile?.credits).toBeGreaterThan(0);

            console.log(`✅ Parent account verified`);
            console.log(`   - tier: ${parentProfile?.tier}`);
            console.log(`   - credits: ${parentProfile?.credits}`);
        });
    });

    // Cleanup after test
    test.afterAll(async () => {
        if (parentId) {
            await supabaseAdmin.auth.admin.deleteUser(parentId);
            console.log(`🧹 Cleaned up parent: ${parentId}`);
        }
        if (childId) {
            await supabaseAdmin.auth.admin.deleteUser(childId);
            console.log(`🧹 Cleaned up child: ${childId}`);
        }
    });
});
