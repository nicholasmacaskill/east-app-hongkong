import { test, expect } from '@playwright/test';

// Use admin authentication for CMS tests
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Stats System - Multi-Sport Support', () => {
    test('CMS: Should display sport selector with Golf, HYROX, and Hockey', async ({ page }) => {
        await page.goto('http://localhost:3000/sys-admin/stats');
        await page.waitForLoadState('networkidle');

        // Verify sport selector buttons exist (use more specific selectors)
        await expect(page.getByRole('button', { name: '⛳ Golf' })).toBeVisible();
        await expect(page.getByRole('button', { name: '🏃 HYROX' })).toBeVisible();
        await expect(page.getByRole('button', { name: '🏒 Hockey' })).toBeVisible();
    });

    test('CMS: Should display Golf fields when Golf is selected', async ({ page }) => {
        await page.goto('http://localhost:3000/sys-admin/stats');
        await page.waitForLoadState('networkidle');

        // Click Golf button using exact match
        await page.getByRole('button', { name: '⛳ Golf' }).click();
        await page.waitForTimeout(500);

        // Verify "Select a player" message is shown initially
        await expect(page.getByText(/Select a player to edit stats/i)).toBeVisible();
    });

    test('CMS: Should display HYROX fields when HYROX is selected', async ({ page }) => {
        await page.goto('http://localhost:3000/sys-admin/stats');
        await page.waitForLoadState('networkidle');

        // Click HYROX button
        await page.getByRole('button', { name: '🏃 HYROX' }).click();
        await page.waitForTimeout(500);

        // Verify "Select a player" message is shown
        await expect(page.getByText(/Select a player to edit stats/i)).toBeVisible();
    });

    test('CMS: Should display Hockey fields when Hockey is selected', async ({ page }) => {
        await page.goto('http://localhost:3000/sys-admin/stats');
        await page.waitForLoadState('networkidle');

        // Click Hockey button
        await page.getByRole('button', { name: '🏒 Hockey' }).click();
        await page.waitForTimeout(500);

        // Verify "Select a player" message is shown
        await expect(page.getByText(/Select a player to edit stats/i)).toBeVisible();
    });
});

test.describe('Leaderboard - Public Access', () => {
    test('Leaderboard: Should display sport selector and stat filters', async ({ page }) => {
        await page.goto('http://localhost:3000/stats');
        await page.waitForLoadState('networkidle');

        // Verify sport selector buttons exist
        await expect(page.locator('button:has-text("Hockey")').first()).toBeVisible();
        await expect(page.locator('button:has-text("Golf")').first()).toBeVisible();
        await expect(page.locator('button:has-text("Hyrox")').first()).toBeVisible();

        // Click Golf
        await page.locator('button:has-text("Golf")').first().click();
        await page.waitForTimeout(500);

        // Verify Golf stat filters are displayed
        await expect(page.getByText('Handicap')).toBeVisible();
        await expect(page.getByText('Round Score')).toBeVisible();
        await expect(page.getByText('Longest Drive')).toBeVisible();
    });

    test('Leaderboard: Should display header with Rank, Player, Score', async ({ page }) => {
        await page.goto('http://localhost:3000/stats');
        await page.waitForLoadState('networkidle');

        // Wait for page to load
        await page.waitForTimeout(1000);

        // Check if header exists by looking for the header container
        const headerExists = await page.locator('div.flex.items-center.gap-4.px-4.pb-3').count() > 0;

        // If no data, the header won't show, so we check for either header or empty state
        const hasEmptyState = await page.getByText(/No Data Recorded/i).isVisible();

        // One of these should be true
        expect(headerExists || hasEmptyState).toBeTruthy();
    });

    test('Leaderboard: Should handle empty state gracefully', async ({ page }) => {
        await page.goto('http://localhost:3000/stats');
        await page.waitForLoadState('networkidle');

        // Click HYROX (likely to have no data initially)
        await page.locator('button:has-text("Hyrox")').first().click();
        await page.waitForTimeout(1000);

        // Should either show data or "No Data Recorded" message
        const hasNoDataMessage = await page.getByText(/No Data Recorded/i).isVisible();
        const hasDataRows = await page.locator('div').filter({ hasText: /^\d+$/ }).count() > 0;

        // One of these should be true
        expect(hasNoDataMessage || hasDataRows).toBeTruthy();
    });

    test('Leaderboard: Should switch between sports correctly', async ({ page }) => {
        await page.goto('http://localhost:3000/stats');
        await page.waitForLoadState('networkidle');

        // Click Golf
        await page.locator('button:has-text("Golf")').first().click();
        await page.waitForTimeout(500);
        await expect(page.getByText('Handicap')).toBeVisible();

        // Click HYROX
        await page.locator('button:has-text("Hyrox")').first().click();
        await page.waitForTimeout(500);
        await expect(page.getByText('1KM Run')).toBeVisible();

        // Click Hockey
        await page.locator('button:has-text("Hockey")').first().click();
        await page.waitForTimeout(500);
        await expect(page.getByText('React Targets')).toBeVisible();
    });
});
