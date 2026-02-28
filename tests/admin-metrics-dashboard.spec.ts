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

        // 6. Check that the intent viewports are visible (Wait for data to load)
        await expect(page.locator('h3:has-text("Net Revenue")')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('p:has-text("Active Mass")')).toBeVisible();
        await expect(page.locator('p:has-text("Stability Index")')).toBeVisible();

        // Check kinetic energy viewport
        await expect(page.locator('h3:has-text("Intent Throughput")')).toBeVisible();
        await expect(page.locator('p:has-text("Credit Flow")')).toBeVisible();

        // Check friction points viewport
        await expect(page.locator('h3:has-text("Sleepers")')).toBeVisible();
        await expect(page.locator('p:has-text("Opacity Index")')).toBeVisible();

        // 7. Verify the telemetry layer
        await expect(page.locator('span:has-text("Live Telemetry")')).toBeVisible();
    });
});
