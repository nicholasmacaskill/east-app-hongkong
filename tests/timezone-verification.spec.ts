import { test, expect } from '@playwright/test';

test.describe('Timezone Consistency Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Assume admin access
        await page.goto('/sys-admin/schedule');
        await expect(page.locator('h1:has-text("Master Schedule")')).toBeVisible();
    });

    test('should create and display a session with consistent HK time', async ({ page }) => {
        // 1. Navigate to a likely empty day (e.g., 2 weeks in the future)
        for (let i = 0; i < 2; i++) {
            await page.locator('button:has(svg.lucide-chevron-right)').first().click();
            await page.waitForTimeout(500);
        }

        // 2. Find an empty day or slot
        const addFirstBtn = page.locator('button:has-text("Add First Entry")');
        const openSlot = page.locator('div:has-text("Open Slot")').first();

        let target = null;
        if (await addFirstBtn.isVisible()) {
            target = addFirstBtn;
        } else if (await openSlot.isVisible()) {
            target = openSlot;
        }

        if (!target) {
            console.log('No empty slot found for test');
            return;
        }

        await target.click();

        // 3. Fill the form with a specific time
        await expect(page.locator('h2:has-text("Add Session")')).toBeVisible();
        await page.fill('input[placeholder="e.g. U14 Shooting Drills"]', 'Timezone Test Session');

        // Use the picker to set a specific time: 08:30 AM to 09:30 AM
        // Note: setting value for datetime-local picker directly
        // We need to know the date selected.
        const dateInput = page.locator('input[type="datetime-local"]').first();
        const currentValue = await dateInput.inputValue();
        const testDate = currentValue.split('T')[0];

        await dateInput.fill(`${testDate}T08:30`);
        await page.locator('input[type="datetime-local"]').nth(1).fill(`${testDate}T09:30`);

        await page.click('button:has-text("Save Session")');

        // 4. Verify display in Admin Timeline
        // Should show "8:30 am"
        await expect(page.locator('text=Timezone Test Session')).toBeVisible();
        await expect(page.locator('text=8:30 am')).toBeVisible();

        // 5. Verify Picker Value on Edit
        await page.click('text=Timezone Test Session');
        await expect(page.locator('input[type="datetime-local"]').first()).toHaveValue(`${testDate}T08:30`);
        await page.click('button:has(svg.lucide-x)'); // Close modal

        // 6. Verify in User Calendar
        await page.goto('/calendar');
        // Wait for loading
        await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });

        // Find the event in the calendar
        // The calendar might be on a different month, need to navigate?
        // Let's check if the event is visible (it fetches all events)
        await expect(page.locator('text=Timezone Test Session')).toBeVisible();
        await expect(page.locator('text=8:30 AM')).toBeVisible(); // Calendar component uses UPPERCASE AM/PM from formatHK or standard format
    });
});
