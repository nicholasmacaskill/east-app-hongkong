
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('Parent Profile Photo Editability (Hardened)', () => {
    let parentUser: any;
    let childUser: any;

    test.beforeAll(async () => {
        const timestamp = Date.now();
        const parentEmail = `p-hardened-${timestamp}@east.com`;
        const childEmail = `c-hardened-${timestamp}@east.com`;

        // 1. Create Users
        const { data: pAuth } = await supabaseAdmin.auth.admin.createUser({
            email: parentEmail,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { role: 'parent', first_name: 'Parent', last_name: 'Hardened' }
        });
        parentUser = pAuth.user;

        const { data: cAuth } = await supabaseAdmin.auth.admin.createUser({
            email: childEmail,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'Child', last_name: 'Hardened' }
        });
        childUser = cAuth.user;

        // 2. Deterministic SQL Setup (Bypass trigger latency)
        // We use UPSERT to ensure the profile exists even if the trigger hasn't fired yet
        const sql = `
            INSERT INTO profiles (id, contact_email, first_name, last_name, role, account_status, subscription_status)
            VALUES ('${parentUser.id}', '${parentEmail}', 'Parent', 'Hardened', 'parent', 'active', 'active')
            ON CONFLICT (id) DO UPDATE SET role = 'parent', account_status = 'active', subscription_status = 'active';

            INSERT INTO profiles (id, contact_email, first_name, last_name, role, account_status, parent_id)
            VALUES ('${childUser.id}', '${childEmail}', 'Child', 'Hardened', 'player', 'active', '${parentUser.id}')
            ON CONFLICT (id) DO UPDATE SET role = 'player', account_status = 'active', parent_id = '${parentUser.id}';

            INSERT INTO player_relationships (parent_id, child_id, relationship_type) 
            VALUES ('${parentUser.id}', '${childUser.id}', 'parent_child') ON CONFLICT DO NOTHING;
        `;
        const sqlFile = path.join('/tmp', `setup-h-${timestamp}.sql`);
        fs.writeFileSync(sqlFile, sql);
        execSync(`node database/execute-sql.ts ${sqlFile}`);
    });

    test.afterAll(async () => {
        if (parentUser) await supabaseAdmin.auth.admin.deleteUser(parentUser.id);
        if (childUser) await supabaseAdmin.auth.admin.deleteUser(childUser.id);
    });

    test('Parent should be able to edit self and child photos', async ({ page }) => {
        await page.goto('/');

        // Wait for landing screen animation
        await page.waitForTimeout(4000);

        // 1. Login
        const parentPortal = page.getByTestId('parent-portal-section');
        await parentPortal.getByRole('button', { name: 'LOGIN' }).click();
        await page.fill('input[placeholder="Enter your email"]', parentUser.email);
        await page.fill('input[placeholder="Enter your password"]', 'Password123!');
        await page.click('button[type="submit"], button:has-text("LOGIN")');

        // Wait for dashboard or home - ensure API load
        await page.waitForSelector('text=HOME', { timeout: 30000 });

        // 2. Navigate to Profile
        await page.click('button:has-text("Profile")');
        await expect(page.locator('h1:has-text("Parent Hardened")')).toBeVisible({ timeout: 20000 });

        // 3. Verify Parent Editability (Avatar & Cover)
        const parentAvatar = page.getByTestId('parent-avatar-container');
        await expect(parentAvatar).toHaveClass(/cursor-pointer/);
        await expect(parentAvatar.locator('svg.lucide-camera').first()).toBeVisible();

        const coverBtn = page.locator('button[title="Update Cover Photo"]');
        await expect(coverBtn).toBeVisible();

        // 4. Verify Child visibility and editability
        // Click Athletes tab
        const athletesTab = page.locator('button:has-text("ATHLETES")');
        if (await athletesTab.isVisible()) {
            await athletesTab.click();
        }

        const childCard = page.locator('[data-testid^="child-section-"]').first();
        await expect(childCard).toBeVisible({ timeout: 20000 });
        await childCard.click();

        // Verify child photo interaction setup
        const childAvatar = childCard.locator('.group\\/childimg');
        await expect(childAvatar).toHaveClass(/cursor-pointer/);
        await expect(childAvatar.locator('svg.lucide-camera').first()).toBeVisible();
    });
});
