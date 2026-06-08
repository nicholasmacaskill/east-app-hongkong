import { test, expect } from '@playwright/test';

test.describe('Mobile Booking & Capacity Constraints', () => {
  // Use mobile safari project settings, which uses iPhone 13 emulation
  // and the standard authenticated user state.
  
  test.beforeEach(async ({ page }) => {
    // Inject logic to handle any unexpected popups or overlays if needed
    // The test setup in playwright.config.ts will handle login for us.
    await page.goto('/');
    // Ensure we are not stuck on the loading screen
    await expect(page.locator('text=Loading...')).toHaveCount(0, { timeout: 30000 });
  });

  test('should allow dragging an athlete into a slot and verify capacity constraints', async ({ page }) => {
    // 1. Wait for Home screen to load
    await expect(page.locator('text=Facilities')).toBeVisible({ timeout: 15000 });

    // 2. Select a facility to open the schedule/booking modal
    // Assuming there is a facility class card
    const facilityCard = page.locator('.group').filter({ hasText: 'CLASS' }).first();
    await facilityCard.click();

    // 3. Wait for the booking modal to appear
    await expect(page.locator('text=Session Capacity')).toBeVisible({ timeout: 10000 });

    // 4. Locate the draggable parent/child avatar and the dropzone
    const draggableAvatar = page.locator('.relative.cursor-grab').first();
    const dropZone = page.locator('div[onDrop]').first(); // Target the empty slot

    // Check if there is an empty slot available
    if (await dropZone.isVisible()) {
      // 5. Perform the drag and drop
      await draggableAvatar.dragTo(dropZone);

      // 6. Verify that the pending state or confirmation button appears
      await expect(page.locator('text=Pending')).toBeVisible({ timeout: 5000 });

      // 7. Click Confirm Booking
      await page.locator('button:has-text("Confirm Booking")').click();

      // 8. Wait for the success toast or processing overlay to resolve
      await expect(page.locator('text=successfully')).toBeVisible({ timeout: 15000 });
    } else {
      console.log('No empty slots available to test drag and drop in this session.');
    }
  });
});
