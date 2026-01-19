import { test, expect } from '@playwright/test';

test.describe('Admin Directory Management', () => {
    test.beforeEach(async ({ page }) => {
        // Go to Admin Dashboard
        await page.goto('/sys-admin');
        // Wait for access
        await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    });

    test('should allow admin to navigate to Directory and create a Coach', async ({ page }) => {
        // 1. Navigate to Directory
        await page.click('a[href="/sys-admin/directory"]');
        await expect(page.locator('h1:has-text("People Directory")')).toBeVisible();

        // 2. Open "Add Coach" Modal
        await page.click('button:has-text("Add Coach")');

        // 3. (Role pre-selected)

        // 4. Fill Form
        const timestamp = Date.now();
        // Use sibling selector (+) to avoid matching parent divs
        await page.locator('label:has-text("First Name") + input').fill('TestCoach');
        await page.locator('label:has-text("Last Name") + input').fill(`Auto-${timestamp}`);
        await page.locator('label:has-text("Email (Invite Link)") + input').fill(`coach-${timestamp}@test.com`);
        await page.locator('label:has-text("Mobile") + input').fill('98765432');
        await page.locator('label:has-text("Bio") + textarea').fill('Automated Test Bio');

        // 5. Submit
        await page.click('button:has-text("Send Invite")');

        // 6. Verify Success Modal "Invite Sent!"
        await expect(page.locator('text=Invite Sent!')).toBeVisible();
        await page.click('button:has-text("Confirm")');

        // 7. Verify new coach appears in list (Coach Tab)
        await page.click('button:has-text("Coaches")');
        await expect(page.locator(`text=Auto-${timestamp}`)).toBeVisible();
    });
});
