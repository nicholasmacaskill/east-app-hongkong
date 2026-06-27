import { test, expect } from '@playwright/test';

test.describe('Player role — profile search on production', () => {
    test('logged-in player can search and view another player profile with stats', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('#email', 'feature-player@east.com');
        await page.fill('#password', 'EastFeatureTest2026!');
        await page.click('button:has-text("LOGIN")');
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

        await page.goto('/stats');
        await page.waitForLoadState('networkidle');

        await page.getByTestId('player-search-input').fill('Ben');
        await expect(page.getByTestId('player-search-results')).toBeVisible({ timeout: 15000 });

        await page.locator('[data-testid^="player-search-result-"]').first().click();
        await page.waitForURL(/\/profile\//, { timeout: 15000 });

        await expect(page.getByText('GOLF PERFORMANCE')).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Handicap')).toBeVisible();
    });
});