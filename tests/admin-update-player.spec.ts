import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Admin Player Update Workflow', () => {
    let adminId: string;
    let playerId: string;
    const uniqueSuffix = Date.now();
    const adminEmail = `admin-update-${uniqueSuffix}@east.com`;
    const playerEmail = `player-to-edit-${uniqueSuffix}@east.com`;
    const playerFirstName = `Original`;
    const playerLastName = `Player-${uniqueSuffix}`;

    test.beforeAll(async () => {
        // 1. Create Admin
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: 'AdminPassword123!',
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'Sys', last_name: 'Admin' }
        });
        if (adminError) throw adminError;
        adminId = adminData.user.id;
        await supabase.from('profiles').upsert({ id: adminId, role: 'sys-admin', first_name: 'Sys', last_name: 'Admin' });

        // 2. Create Player
        const { data: playerData, error: playerError } = await supabase.auth.admin.createUser({
            email: playerEmail,
            password: 'PlayerPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: playerFirstName, last_name: playerLastName }
        });
        if (playerError) throw playerError;
        playerId = playerData.user.id;
        await supabase.from('profiles').upsert({ id: playerId, role: 'player', first_name: playerFirstName, last_name: playerLastName, position: 'Bench', team: 'U10' });
    });

    test.afterAll(async () => {
        if (adminId) await supabase.auth.admin.deleteUser(adminId);
        if (playerId) await supabase.auth.admin.deleteUser(playerId);
    });

    test('should allow admin to update player details (Name, Position, Team)', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', 'AdminPassword123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('/sys-admin');

        // 2. Go to Directory
        await page.click('a[href="/sys-admin/directory"]');
        await expect(page.locator('h1:has-text("People Directory")')).toBeVisible();

        // 3. Find Player (Unassigned)
        await page.fill('input[placeholder*="Search"]', playerFirstName);

        // Wait for search results
        const playerCard = page.locator('div.group').filter({ hasText: playerFirstName }).first();
        await expect(playerCard).toBeVisible();

        // 4. Click Edit Button
        // Selector logic: In the unassigned card, buttons are at bottom right. Edit is usually the first one or identified by icon.
        // Based on analysis, it is a button with an edit icon.
        const editBtn = playerCard.locator('button').filter({ has: page.locator('svg.lucide-edit-2') }).first();
        await editBtn.click();

        // 5. Verify Modal Opens
        const modal = page.locator('div.fixed').filter({ hasText: 'Edit Profile' });
        await expect(modal).toBeVisible();

        // 6. Update Fields
        // Inputs have labels: "First Name", "Last Name", "Position", "Team"
        await modal.locator('label:has-text("First Name") + input').fill('Updated');
        await modal.locator('label:has-text("Last Name") + input').fill(`Edited-${uniqueSuffix}`);
        await modal.locator('label:has-text("Position") + input').fill('Striker');
        await modal.locator('label:has-text("Team") + input').fill('U18 Elite');

        // 7. Save and Handle Alert
        page.once('dialog', async dialog => {
            expect(dialog.message()).toBe('Profile updated successfully');
            await dialog.accept();
        });
        await modal.getByText('Save Changes').click();

        // 8. Verify Update in List
        // Wait for modal to close
        await expect(modal).not.toBeVisible();

        // Search for new name
        await page.fill('input[placeholder*="Search"]', 'Updated');
        const updatedCard = page.locator('div.group').filter({ hasText: 'Updated' }).first();
        await expect(updatedCard).toBeVisible();
        await expect(updatedCard).toContainText(`Edited-${uniqueSuffix}`);

        // 9. Verify DB confirmation
        const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', playerId).single();
        expect(updatedProfile.first_name).toBe('Updated');
        expect(updatedProfile.position).toBe('Striker');
        expect(updatedProfile.team).toBe('U18 Elite');
    });
});
