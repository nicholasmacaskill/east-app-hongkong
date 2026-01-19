import { test, expect } from '@playwright/test';

test.describe('Parent Credit Transfer', () => {
    test.beforeEach(async ({ page }) => {
        // Go to profile page (tab=profile)
        await page.goto('/?tab=profile');
        // Wait for profile to load (Parent Account)
        await expect(page.locator('text=PARENT ACCT')).toBeVisible({ timeout: 10000 });
    });

    test('should allow parent to transfer credits to child', async ({ page }) => {
        // 1. Check if we have children to transfer to
        let transferBtn = page.locator('button:has-text("+ Transfer")').first();

        // If no children, create one!
        if (await transferBtn.count() === 0) {
            console.log('No children found. Creating a test child...');

            await page.click('button:has-text("+ Register New Athlete")');

            // Fill Modal
            await page.fill('input[placeholder="e.g. Michael"]', 'TestChild');
            await page.fill('input[placeholder="e.g. Jordan"]', 'Athlete');
            await page.fill('input[placeholder="child@example.com"]', `child-${Date.now()}@test.com`);
            await page.fill('input[placeholder="e.g. Ice Hockey"]', 'Testing');

            // Save
            await page.click('button:has-text("Save")');

            // Handle Success Alert
            page.once('dialog', dialog => {
                console.log(`Alert: ${dialog.message()}`);
                dialog.dismiss();
            });

            // Wait for reload or list update
            await page.waitForTimeout(2000);
            // In a real app we might reload or wait for state. 
            // ParentProfile handles "setRefreshKey" on success which re-fetches.
            // So we wait for the Transfer button to appear.

            // Re-locate
            transferBtn = page.locator('button:has-text("+ Transfer")').first();
            await expect(transferBtn).toBeVisible({ timeout: 10000 });
        }

        // 2. Open Transfer Modal
        await transferBtn.click();
        const modal = page.locator('text=Transfer Credits');
        await expect(modal).toBeVisible();

        // 3. Input Amount (Type "5")
        // Note: We updated this to type="number"
        const input = page.locator('input[type="number"]');
        await input.fill('5');

        // 4. Confirm
        // Listener for success alert
        page.once('dialog', dialog => {
            console.log(`Transfer Alert: ${dialog.message()}`);
            expect(dialog.message()).toContain('transferred successfully');
            dialog.dismiss();
        });

        await page.click('button:has-text("Confirm Transfer")');

        // 6. Verify Modal Closes
        await expect(modal).not.toBeVisible({ timeout: 10000 });
    });
});
