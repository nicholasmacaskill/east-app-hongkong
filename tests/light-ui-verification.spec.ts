import { test, expect } from '@playwright/test';

const PROD_URL = 'https://app.eastsportsgroup.com';
const COACH_EMAIL = 'coach_alpha_test@example.com';
const TEST_PASSWORD = 'password123';

test.describe('Light UI Verification (Non-Destructive)', () => {
    test('UI Components Mount and Route Correctly', async ({ page }) => {
        // 1. Load the landing page
        await page.goto(PROD_URL);
        
        // 2. Select the Coach Portal via the unbreakable data-testid
        await page.getByTestId('coach-portal-section').getByRole('button', { name: 'LOGIN' }).click();
        
        // 3. Log in
        await page.getByPlaceholder('Email Address').fill(COACH_EMAIL);
        await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
        await page.getByRole('button', { name: 'LOGIN' }).click();
        
        // 4. Verify Coach Dashboard mounts by checking for the Manage Drill Hub button
        const manageHubBtn = page.getByTestId('manage-drill-hub-btn');
        await expect(manageHubBtn).toBeVisible({ timeout: 15000 });
        
        // 5. Open Drill Hub
        await manageHubBtn.click();
        
        // 6. Verify Drill Hub mounts by checking for the Publish button
        const publishBtn = page.getByTestId('publish-new-drill-btn');
        await expect(publishBtn).toBeVisible({ timeout: 5000 });

        // If it gets here, we mathematically know the React components rendered and didn't crash,
        // and the CSS isn't hiding the buttons from the user.
        console.log("✅ Light UI Verification Passed: Components rendered and are accessible.");
    });
});
