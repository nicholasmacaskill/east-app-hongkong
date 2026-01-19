import { test, expect } from '@playwright/test';

test.describe('Transaction History Feature', () => {

    test('Player can access transaction history from settings and credits badge', async ({ page }) => {
        // 1. Navigation & Role Selection
        await page.goto('/');

        // Handle Landing Screen (wait for animation)
        const playerLoginBtn = page.locator('button:has-text("PLAYER LOGIN")');
        try {
            // Wait up to 10s for the button to appear (animation takes ~3s)
            await playerLoginBtn.waitFor({ state: 'visible', timeout: 10000 });
            await playerLoginBtn.click();
        } catch (e) {
            // If not found, assume we are already past it
            console.log("Landing screen skipped or not found");
        }

        // 2. Login (if needed)
        const signInBtn = page.locator('button:has-text("LOGIN")'); // Corrected from "Sign In" to "LOGIN"
        // Let's check AuthScreen: "LOGIN" (line 162)
        // Wait, line 162: {loading ? 'LOGGING IN...' : 'LOGIN'}
        // My previous test used 'Sign In'. That was WRONG!
        // AuthScreen button text is "LOGIN".

        // I need to correct the selector for Login button too!

        // Check if the login form is visible, if so, log in
        if (await page.locator('input[type="email"]').isVisible()) {
            // Fill in login details (assuming standard demo player creds or flow)
            await page.fill('input[type="email"]', 'player@demo.com');
            await page.fill('input[type="password"]', 'password123');
            await signInBtn.click();
        }



        // Wait for profile to load (look for Credits badge which is always there)
        await expect(page.locator('text=CREDITS AVAILABLE')).toBeVisible({ timeout: 15000 });

        // 2. Test Access via Settings Modal
        await page.click('button[title="Settings"]'); // Using the Edit2 icon button which opens settings
        // Wait for Settings Modal
        await expect(page.locator('text=Settings')).toBeVisible();
        await expect(page.locator('text=Transaction History')).toBeVisible();

        // Click Transaction History
        await page.click('text=Transaction History');

        // Verify Transaction History Modal Opens
        await expect(page.locator('text=Transaction History')).toBeVisible();
        await expect(page.locator('text=Date')).toBeVisible(); // Table header
        await expect(page.locator('text=Amount')).toBeVisible(); // Table header

        // Close Modal
        await page.click('button:has-text("Close")');
        await expect(page.locator('text=Transaction History')).not.toBeVisible();

        // 3. Test Access via Credits Badge
        // Find the Credits Available badge
        const creditsBadge = page.locator('div', { hasText: 'CREDITS\nAVAILABLE' });
        await expect(creditsBadge).toBeVisible();

        // Click the badge
        await creditsBadge.click();

        // Verify Transaction History Modal Opens again
        await expect(page.locator('text=Transaction History')).toBeVisible();

        // Close again
        await page.click('button:has-text("Close")');
        await expect(page.locator('text=Transaction History')).not.toBeVisible();
    });

});
