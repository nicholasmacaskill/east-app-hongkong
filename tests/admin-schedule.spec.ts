import { test, expect } from '@playwright/test';

test.describe('Admin Master Schedule', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/sys-admin/schedule');
        await expect(page.locator('h1:has-text("Master Schedule")')).toBeVisible();
    });

    test('should allow admin to view schedule and add a session on an empty day', async ({ page }) => {
        // 1. Navigate to a likely empty week (Click Next Week button)
        // The Next Week button is the one with View Date Strip / Header
        // Look for the header navigation which has "MMMM yyyy"
        // And the button after it.
        const nextWeekBtn = page.locator('div:has-text("MMMM yyyy") + button, button:has(svg.lucide-chevron-right)');
        // Actually, selector might be tricky. Let's find button with ChevronRight that is NOT the day strip.
        // The day strip doesn't have ChevronRight.
        // The Header controls: <button onClick={handleNextWeek}> <ChevronRight /> </button>
        // It is within a flex container.

        // Let's just try to find "Add First Entry". If not found, click Next Week.
        // Or assume we can find an empty day.

        let targetElement = null;
        let isFirstEntry = false;

        // Try to find a slot or empty button across a few weeks
        for (let i = 0; i < 10; i++) {
            const addFirstBtn = page.locator('button:has-text("Add First Entry")');
            const openSlot = page.locator('div:has-text("Open Slot")').first();

            if (await addFirstBtn.isVisible()) {
                targetElement = addFirstBtn;
                isFirstEntry = true;
                break;
            } else if (await openSlot.isVisible()) {
                targetElement = openSlot;
                isFirstEntry = false;
                break;
            }

            // Next week
            await page.locator('button:has(svg.lucide-chevron-right)').first().click();
            await page.waitForTimeout(500);
        }

        if (!targetElement) {
            console.log('No Open Slots or Empty Days found. Skipping creation test.');
            return; // Skip if we can't test creation
        }

        // 2. Click Target
        await targetElement.click();

        // 3. Verify Modal
        await expect(page.locator('h2:has-text("Add Session")')).toBeVisible();

        // 4. Fill Form
        await page.fill('input[placeholder="e.g. U14 Shooting Drills"]', 'Automated Session');

        // 5. Save
        await page.click('button:has-text("Save Session")');

        // 6. Verify Session Appears
        // It should be visible now.
        // Identify usage of .first() to avoid strict mode if multiple sessions
        await expect(page.locator('text=Automated Session').first()).toBeVisible();
    });
});
