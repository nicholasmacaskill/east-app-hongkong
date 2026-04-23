import { test, expect } from '@playwright/test';

test.describe('EAGL Stats & Credit Adjusted Flow Verification', () => {

    test('Admin can adjust credits with a note, add EAGL stats, and view resulting leaderboard/profile', async ({ page }) => {
        // Step 1: Login
        await page.goto('https://test-branch-east.vercel.app');
        await page.click('button:has-text("Staff Portal")');
        await page.fill('input[type="email"]', 'qaben@east.com');
        await page.fill('input[type="password"]', 'EastQA_Ben2026!');
        await page.click('button:has-text("Login")');

        // Step 2: Navigate to Directory
        await page.waitForTimeout(2000); // UI load buffer
        await page.click('a[href="/sys-admin/directory"]');
        await expect(page.locator('h1', { hasText: 'People Directory' })).toBeVisible({ timeout: 10000 });

        // Search for a test user (we'll just edit the first one or search "Test")
        await page.fill('input[placeholder*="Search"]', 'Test');
        await page.waitForTimeout(1000); // let search filter

        // Click Edit on the first matching player
        const editButton = page.locator('button.bg-blue-500\\/10').first(); 
        if (await editButton.isVisible()) {
            await editButton.click();
        } else {
            console.log("No test user found, editing Ben QA");
            await page.fill('input[placeholder*="Search"]', 'QA');
            await page.waitForTimeout(1000);
            await page.locator('button.bg-blue-500\\/10').first().click();
        }

        // Wait for modal
        await expect(page.locator('h2', { hasText: 'Edit Profile' })).toBeVisible();

        // Check if Credits and Note inputs exist
        const creditsInput = page.locator('input[type="number"]').first();
        const initialCredits = await creditsInput.inputValue();
        const newCredits = (parseInt(initialCredits) || 0) + 10;
        
        await creditsInput.fill(newCredits.toString());

        // The Note field should now be enabled
        const noteInput = page.locator('input[placeholder*="Booking refund"]');
        await expect(noteInput).not.toBeDisabled();
        await noteInput.fill('CEO Review Test Addition');

        // Save
        const saveButton = page.locator('button:has-text("Save Profile")');
        if (await saveButton.isVisible()) {
             await saveButton.click();
        } else {
             await page.click('button:has-text("Save")');
        }
        
        await expect(page.locator('text=Profile updated successfully')).toBeVisible({ timeout: 10000 });

        // Step 3: Stats Panel
        await page.goto('https://test-branch-east.vercel.app/sys-admin/stats');
        await expect(page.locator('h1', { hasText: 'Stats Matcher' })).toBeVisible();
        
        // Select EAGL category
        await page.click('button:has-text("EAGL")');
        await page.waitForTimeout(1000);

        // Select a user from the dropdown
        await page.click('select');
        await page.selectOption('select', { index: 1 }); // select first player
        await page.waitForTimeout(1000);

        // Fill out EAGL stats
        await page.fill('label:has-text("Season") + input', '2');
        await page.selectOption('label:has-text("Division") + select', 'Pro Men');
        await page.fill('label:has-text("Week") + input', '5');
        await page.fill('label:has-text("Score") + input', '72');

        await page.click('button:has-text("Save & Verify Stats")');
        await expect(page.locator('text=Stats saved successfully')).toBeVisible({ timeout: 10000 });

        // Step 4: Leaderboard filtering
        await page.goto('https://test-branch-east.vercel.app/stats');
        await page.click('button:has-text("EAGL")');
        
        await expect(page.locator('select').nth(0)).toBeVisible(); // Division
        await expect(page.locator('input[type="number"]').nth(0)).toBeVisible(); // Season
        await expect(page.locator('input[type="number"]').nth(1)).toBeVisible(); // Week
        
        await page.selectOption('select', 'Pro Men');
        await page.fill('input[type="number"]', '2'); // Fill first number input (Season)
        
        // We should see our score of 72
        await expect(page.locator('text=72')).toBeVisible({ timeout: 10000 });
        
        console.log("Full multi-variate integration verified successfully.");
    });
});
