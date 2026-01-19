import { test, expect } from '@playwright/test';

test.describe('Admin Service Management', () => {
    test.beforeEach(async ({ page }) => {
        // Go to Admin Services Page
        await page.goto('/sys-admin/services');
        // Verify Header
        await expect(page.locator('h1:has-text("Manage Services")')).toBeVisible();
    });

    test('should allow admin to create a new Class Service', async ({ page }) => {
        // 1. Open "Add Service" Modal
        await page.click('button:has-text("Add Service")');

        // 2. Verify Modal Title
        await expect(page.locator('h2:has-text("New Service")')).toBeVisible();

        // 3. Fill Form
        const timestamp = Date.now();
        const serviceName = `TestClass-${timestamp}`;

        // Inputs have labels
        await page.locator('label:has-text("Service Title") + input').fill(serviceName);
        await page.locator('label:has-text("Description") + textarea').fill('Automated Test Description');

        // default Category is CLASS, so we don't need to change it
        // But we can verify it
        // await expect(page.locator('button:has-text("CLASS")')).toHaveClass(/border-blue-500/);

        // 4. Submit
        await page.click('button:has-text("Create Service")');

        // 5. Verify Success Toast
        // Only if toast is reliable, otherwise wait for modal close
        await expect(page.locator('h2:has-text("New Service")')).not.toBeVisible();

        // 6. Verify new service appears in list
        // It should be refreshed
        await expect(page.locator(`h3:has-text("${serviceName}")`)).toBeVisible();
    });
});
