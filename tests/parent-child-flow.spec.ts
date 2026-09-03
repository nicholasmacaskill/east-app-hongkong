import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Parent Profile & Child Athlete Management Flow', () => {
    const timestamp = Math.floor(100000 + Math.random() * 900000);
    const childFirstName = `Leo${timestamp}`;
    const childLastName = `Messi${timestamp}`;
    const athleteEmail = `athlete-${timestamp}@pw.test`;
    const athletePassword = 'password12345';
    let createdChildId: string | null = null;

    test.afterAll(async () => {
        if (createdChildId) {
            await supabase.from('player_relationships').delete().eq('child_id', createdChildId);
            await supabase.from('profiles').delete().eq('id', createdChildId);
            await supabase.auth.admin.deleteUser(createdChildId);
        }
    });

    test('should add child without requiring email/phone, inherit parent contact, and allow athlete conversion', async ({ page }) => {
        page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));

        // 1. Visit Home
        console.log('[TEST] Navigating to Home...');
        await page.goto('/');
        await expect(page.locator('h2:has-text("Breaking News")')).toBeVisible({ timeout: 15000 });

        // 2. Click Profile tab in bottom navigation
        console.log('[TEST] Clicking Profile tab in bottom nav...');
        const profileNav = page.locator('button', { hasText: 'Profile' }).first();
        await expect(profileNav).toBeVisible();
        await profileNav.click();

        // 3. Verify Parent Profile is loaded and status is ACTIVE
        console.log('[TEST] Verifying Parent Profile loaded...');
        await expect(page.locator('span:has-text("PARENT ACCT")')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('span:has-text("STATUS: ACTIVE")')).toBeVisible();

        // 4. Click "+ Register New Athlete" button
        console.log('[TEST] Opening Register New Athlete modal...');
        const registerBtn = page.locator('button:has-text("+ Register New Athlete")');
        await expect(registerBtn).toBeVisible();
        await registerBtn.click();

        // 5. Verify Add Child / Register Athlete modal opens without requiring email/phone
        await expect(page.locator('h3:has-text("Register Athlete")')).toBeVisible();
        await expect(page.locator('text=ℹ️ Contact Info:')).toBeVisible();

        // Fill in only First Name, Last Name, and Sport using data-testids
        console.log('[TEST] Filling athlete details...');
        await page.fill('[data-testid="child-first-name-input"]', childFirstName);
        await page.fill('[data-testid="child-last-name-input"]', childLastName);
        await page.fill('[data-testid="child-sport-input"]', 'Basketball');

        // Click Save
        console.log('[TEST] Saving new athlete...');
        await page.click('[data-testid="child-save-btn"]');

        // 6. Verify toast notification and new athlete card in UI
        console.log('[TEST] Verifying child athlete card in UI...');
        await expect(page.locator('h4', { hasText: new RegExp(childFirstName, 'i') })).toBeVisible({ timeout: 15000 });

        // 7. DB Verification: Check child profile in Supabase
        console.log('[TEST] Verifying child in DB...');
        const { data: childProfile, error: childDbErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('first_name', childFirstName)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        expect(childDbErr).toBeNull();
        expect(childProfile).toBeDefined();
        expect(childProfile.role).toBe('player');
        expect(childProfile.first_name).toBe(childFirstName);
        expect(childProfile.contact_email).toBeTruthy(); // Inherited parent email
        createdChildId = childProfile.id;
        console.log(`[TEST] Found child profile ${createdChildId} with contact email: ${childProfile.contact_email}`);

        // 8. Test Athlete Conversion via Modal
        console.log('[TEST] Opening Conversion Modal...');
        const childCard = page.locator(`[data-testid="child-section-${createdChildId}"]`);
        await expect(childCard).toBeVisible();

        const convertBtn = childCard.locator('button:has-text("Convert")');
        await expect(convertBtn).toBeVisible();
        await convertBtn.click();

        // 9. Verify Conversion Modal opens
        await expect(page.locator('h3:has-text("Convert to Full Athlete")')).toBeVisible();

        // Fill in new independent athlete credentials
        console.log(`[TEST] Converting child to standalone athlete (${athleteEmail})...`);
        await page.fill('[data-testid="convert-email-input"]', athleteEmail);
        await page.fill('[data-testid="convert-password-input"]', athletePassword);

        await page.click('[data-testid="convert-confirm-btn"]');

        // Wait for conversion completion toast
        await expect(page.locator('text=converted to a full athlete account')).toBeVisible({ timeout: 15000 });

        // 10. DB Verification: Verify profile and auth user updated to new standalone email
        console.log('[TEST] Verifying converted credentials in DB and Auth...');
        const { data: updatedChildProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', createdChildId)
            .single();

        expect(updatedChildProfile.contact_email).toBe(athleteEmail.toLowerCase());

        const { data: updatedAuthUser } = await supabase.auth.admin.getUserById(createdChildId);
        expect(updatedAuthUser.user?.email).toBe(athleteEmail.toLowerCase());
        console.log('[TEST] Parent Child flow verified successfully!');
    });
});
