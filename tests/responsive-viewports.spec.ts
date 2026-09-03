import { test, expect } from '@playwright/test';

const VIEWPORTS = [
    { name: 'Desktop HD', width: 1440, height: 900, isMobile: false },
    { name: 'iPad Air (Portrait)', width: 820, height: 1180, isMobile: true },
    { name: 'iPhone 14 Pro', width: 393, height: 852, isMobile: true },
    { name: 'iPhone SE (Compact)', width: 375, height: 667, isMobile: true }
];

test.describe('Multi-Device Responsive Viewport Matrix', () => {
    for (const vp of VIEWPORTS) {
        test(`should render cleanly without overflow on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height });

            // 1. Home Screen Verification
            await page.goto('/');
            await expect(page.locator('h2:has-text("Breaking News")')).toBeVisible({ timeout: 15000 });

            // Assert zero horizontal bleed/overflow
            const { scrollWidth, clientWidth } = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth
            }));
            expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 0 horizontal overflow

            // Assert bottom navigation bar visibility & buttons
            const profileBtn = page.locator('button:has-text("Profile")').first();
            await expect(profileBtn).toBeVisible();

            // 2. Profile Screen Navigation & Modal Sizing
            await profileBtn.click();
            await expect(page.locator('span:has-text("PARENT ACCT"), h3:has-text("REGISTERED ATHLETES")').first()).toBeVisible({ timeout: 10000 });

            // Open Add Athlete Modal
            const registerBtn = page.locator('button:has-text("+ Register New Athlete")');
            if (await registerBtn.isVisible()) {
                await registerBtn.click();
                await expect(page.locator('h3:has-text("Register Athlete")')).toBeVisible();

                // Check modal width stays within viewport bounds
                const modalBox = await page.locator('h3:has-text("Register Athlete")').boundingBox();
                expect(modalBox).not.toBeNull();
                expect(modalBox!.x).toBeGreaterThanOrEqual(0);
                expect(modalBox!.x + modalBox!.width).toBeLessThanOrEqual(vp.width + 10);

                // Close modal
                await page.click('button:has-text("Cancel")');
            }

            // 3. Membership Matrix Screen Responsiveness
            await page.goto('/membership');
            await expect(page.getByRole('heading', { name: 'MEMBERSHIP' }).first()).toBeVisible({ timeout: 10000 });

            const memScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
            const memClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
            expect(memScrollWidth).toBeLessThanOrEqual(memClientWidth + 2);
        });
    }
});
