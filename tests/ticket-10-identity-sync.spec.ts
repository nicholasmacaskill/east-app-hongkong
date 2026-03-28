
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Environment variables for direct Supabase access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

test.describe('Ticket #10: Identity Sync & Dashboard Verification', () => {
    let adminEmail: string;
    const adminPassword = 'TempAdminPassword123!';
    const TEST_EMAIL = `verify-sync-${Date.now()}@east.com`;

    test.beforeAll(async () => {
        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase environment variables');
        }
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        adminEmail = `temp-admin-${Date.now()}@east.com`;

        // Create a temporary admin user
        const { data: user, error: authError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'Test', last_name: 'Admin' }
        });

        if (authError) throw authError;

        // Ensure they have the correct role in profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: 'sys-admin' })
            .eq('id', user.user.id);

        if (profileError) throw profileError;
        console.log(`[TEST_SETUP] Created temporary admin: ${adminEmail}`);
    });

    test('should allow account re-creation after profile deletion (Identity Sync Trigger)', async ({ page }) => {
        // 1. Login as the newly created Admin
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        
        // Handle portal selection if visible, otherwise assume direct login
        const adminPortalBtn = page.locator('button:has-text("ADMIN PORTAL")');
        if (await adminPortalBtn.isVisible()) {
            await adminPortalBtn.click();
        }

        await page.fill('input[name="email"]', adminEmail);
        await page.fill('input[name="password"]', adminPassword);
        await page.click('button:has-text("LOGIN")');
        
        await page.waitForTimeout(2000); 

        // 2. Create a test user
        console.log(`[TEST] Creating test user: ${TEST_EMAIL}`);
        await page.goto('/sys-admin/people');
        await page.click('button:has-text("Add New")'); 
        
        await page.fill('input[placeholder="First Name"]', 'Verify');
        await page.fill('input[placeholder="Last Name"]', 'Ticket10');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.selectOption('select', 'player');
        
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);
        
        // 3. Delete the user (Triggers the SQL Sync Trigger)
        console.log(`[TEST] Deleting test user...`);
        await page.goto('/sys-admin/people');
        await page.fill('input[placeholder*="Search"]', TEST_EMAIL);
        await page.click('button[title*="Delete"]');
        await page.click('button:has-text("Confirm")');
        await page.waitForTimeout(2000); // Wait for trigger to propagate
        
        // 4. ATTEMPT RE-CREATION
        console.log(`[TEST] Attempting re-creation of same email: ${TEST_EMAIL}`);
        await page.click('button:has-text("Add New")'); 
        await page.fill('input[placeholder="First Name"]', 'Verify');
        await page.fill('input[placeholder="Last Name"]', 'Re-created');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.selectOption('select', 'player');
        await page.click('button:has-text("Create")');
        
        // IF TICKET #10 IS FIXED: This should NOT show "Email already registered"
        const errorAlert = page.locator('text=Email already registered');
        await expect(errorAlert).not.toBeVisible();
    });

    test('should display the Resolution Summary on Engineering Dashboard cards', async ({ page }) => {
        // Assume logged in from previous test or re-login
        await page.goto('/login');
        const adminPortalBtn = page.locator('button:has-text("ADMIN PORTAL")');
        if (await adminPortalBtn.isVisible()) {
            await adminPortalBtn.click();
        }
        await page.fill('input[name="email"]', adminEmail);
        await page.fill('input[name="password"]', adminPassword);
        await page.click('button:has-text("LOGIN")');

        await page.goto('/sys-admin/tickets');
        
        // Look for Ticket #10 card and Resolution Summary
        const ticketCard = page.locator('div:has-text("#10")');
        await expect(ticketCard).toBeVisible();
        await expect(ticketCard.locator('text=Resolution Summary')).toBeVisible();
        await expect(ticketCard).toContainText('implemented a PostgreSQL SECURITY DEFINER trigger');
    });
});
