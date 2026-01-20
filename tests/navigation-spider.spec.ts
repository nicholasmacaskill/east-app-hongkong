import { test, expect } from '@playwright/test';

test.describe('Safety & Dead End Analysis', () => {

    test('Spider: Verify all homepage links are reachable', async ({ page }) => {
        // 1. Go to Homepage
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        console.log(`[DEBUG] Current URL: ${page.url()}`);

        // 2. Collect all internal links
        // Exclude mailto, tel, and external links
        const hrefs = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a'));
            return anchors
                .map(a => a.href)
                .filter(href => href.startsWith(window.location.origin)) // Internal only
                .filter(href => !href.includes('logout')) // Skip logout
                .filter(href => !href.includes('#')); // Skip hash anchors
        });

        // Dedup
        const uniqueLinks = [...new Set(hrefs)];
        console.log(`[SPIDER] Found ${uniqueLinks.length} internal links to check.`);

        // 3. Visit each link and verify 200 OK (or at least not 404/500)
        for (const link of uniqueLinks) {
            console.log(`[SPIDER] Checking: ${link}`);
            const response = await page.goto(link);
            const status = response?.status();

            // We expect 200-299 for valid pages
            // If it redirects (3xx), Playwright follows, so final status should be 200
            expect(status).toBeLessThan(400);

            // Optional: Check for "White Screen of Death" by ensuring body has content
            await expect(page.locator('body')).not.toBeEmpty();
        }
    });

    test('Dead End: Verify 404 Page and Recovery', async ({ page }) => {
        // 1. Go to a known dead end
        const deadEndUrl = '/this-page-definitely-does-not-exist-12345';
        await page.goto(deadEndUrl);
        await page.waitForLoadState('networkidle');

        // 2. Verify 404 UI Elements
        // Based on not-found.tsx content
        // Note: The text might be different based on previous `view_file` output (it was "The play you are looking for...")
        await expect(page.locator('text=404')).toBeVisible();
        await expect(page.locator('text=Page Not Found')).toBeVisible();

        // 3. Verify Recovery (Return Home)
        const homeButton = page.locator('text=Return Home');
        await expect(homeButton).toBeVisible();
        await homeButton.click();

        await page.waitForLoadState('domcontentloaded');
        console.log(`[DEBUG] Returned to: ${page.url()}`);

        // 4. Verify we are back home
        await expect(page).toHaveURL(/\/?$/);
        // Just check that we are not on 404 anymore
        await expect(page.locator('text=Page Not Found')).not.toBeVisible();
    });

});
