import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Wait for page to be hydrated and animations to settle
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Allow for nebula background to stabilize
    });

    test('Athlete Home Screen - Visual Match', async ({ page }) => {
        // The project uses a "setup" dependency in playwright.config.ts to handle auth
        // So we should already be logged in as a user (player) here.
        await expect(page).toHaveScreenshot('athlete-home.png', {
            mask: [page.locator('[class*="date"]'), page.locator('[class*="time"]')], // Mask dynamic date/time content
            fullPage: true,
        });
    });

    test('Admin Dashboard - Visual Match', async ({ page, browser }) => {
        // Need to use the admin project context
        const adminPage = await browser.newPage({ storageState: 'playwright/.auth/admin.json' });
        await adminPage.goto('/sys-admin');
        await adminPage.waitForLoadState('networkidle');
        await adminPage.waitForTimeout(2000);

        await expect(adminPage).toHaveScreenshot('admin-dashboard.png', {
            mask: [adminPage.locator('[class*="stats"]')], // Mask dynamic stats
            fullPage: true,
        });
        await adminPage.close();
    });

    test('Booking Modal - Visual Match', async ({ page }) => {
        const classCard = page.locator('[class*="service"], [class*="class"]').first();
        if (await classCard.isVisible()) {
            await classCard.click();
            const modal = page.locator('[role="dialog"], .modal-content').first();
            await modal.waitFor({ state: 'visible' });
            await page.waitForTimeout(1000); // Wait for modal open animation

            await expect(modal).toHaveScreenshot('booking-modal.png', {
                mask: [modal.locator('[class*="instructor-name"]')], // Mask names if dynamic
            });
        }
    });

    test('Admin Schedule View - Visual Match', async ({ browser }) => {
        const adminPage = await browser.newPage({ storageState: 'playwright/.auth/admin.json' });
        await adminPage.goto('/sys-admin/schedule');
        await adminPage.waitForLoadState('networkidle');
        await adminPage.waitForTimeout(2000);

        await expect(adminPage).toHaveScreenshot('admin-schedule.png', {
            mask: [adminPage.locator('.calendar-header')], // Mask the current date/month
            fullPage: true,
        });
        await adminPage.close();
    });
});
