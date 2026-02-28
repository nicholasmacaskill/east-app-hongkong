import { test, expect } from '@playwright/test';

test.describe('Admin Key Metrics Dashboard', () => {
    // Re-use existing admin setup if applicable
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Sys-admin can access the Key Metrics Dashboard and view data', async ({ page }) => {
        // 1. Navigate to the admin dashboard
        await page.goto('/sys-admin');

        // 2. Look for the Key Metrics card
        const metricsCard = page.locator('h2', { hasText: 'Key Metrics' });
        await expect(metricsCard).toBeVisible();

        // 3. Click the link to open the dashboard (multiple links exist, use first)
        await page.locator('a[href="/sys-admin/metrics"]').first().click();

        // 4. Wait for navigation and API load
        await expect(page).toHaveURL(/.*\/sys-admin\/metrics/);

        // 5. Verify the main dashboard title
        const mainTitle = page.locator('h1', { hasText: 'Key Metrics' });
        await expect(mainTitle).toBeVisible();

        // 6. Check that top level KPI cards are visible (Wait for data to load)
        await expect(page.locator('h3:has-text("Estimated MRR")')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('h3:has-text("Subscriber Growth")')).toBeVisible();
        await expect(page.locator('h3:has-text("Active Subscribers")')).toBeVisible();
        await expect(page.locator('h3:has-text("Retention & Churn")')).toBeVisible();

        // Check health metrics
        await expect(page.locator('p:has-text("MAU (30D)")')).toBeVisible();
        await expect(page.locator('p:has-text("Sleepers (At Risk)")')).toBeVisible();
        await expect(page.locator('p:has-text("Credit Velocity")')).toBeVisible();

        // 7. Verify the lower charts/tables components
        await expect(page.locator('h3:has-text("Total Bookings")')).toBeVisible();
        await expect(page.locator('h3:has-text("Credits Spent")')).toBeVisible();

        // 7. Verify the lower charts/tables components
        await expect(page.locator('h3:has-text("Bookings by Facility")')).toBeVisible();
        await expect(page.locator('h3:has-text("Bookings by Coach")')).toBeVisible();
        await expect(page.locator('h3:has-text("Activity Timeline")')).toBeVisible();
        await expect(page.locator('h3:has-text("Peak Booking Times (24h)")')).toBeVisible();
    });
});
