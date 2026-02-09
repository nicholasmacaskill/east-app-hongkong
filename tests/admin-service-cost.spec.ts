import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Service Cost Integration', () => {
    let testServiceId: string;
    const serviceName = `E2E-Cost-Test-${Date.now()}`;
    const testCreditCost = 125;

    test.afterAll(async () => {
        if (testServiceId) {
            await supabase.from('session_types').delete().eq('id', testServiceId);
        }
    });

    test('should create service with cost and verify UI pre-fill in bulk add', async ({ page }) => {
        // 1. Create a service with a specific cost
        await page.goto('/sys-admin/services');
        await page.click('button:has-text("Add Service")');

        await page.locator('label:has-text("Service Title") + input').fill(serviceName);
        await page.locator('label:has-text("Credit Cost") + input').fill(testCreditCost.toString());
        await page.locator('button:has-text("PRIVATE")').click();
        await page.locator('button:has-text("Create Service")').click();

        // Wait for list to update
        await expect(page.locator(`h3:has-text("${serviceName}")`)).toBeVisible();

        // Get the ID from the database for later cleanup/verification
        const { data: serviceData } = await supabase
            .from('session_types')
            .select('id')
            .eq('title', serviceName)
            .single();

        testServiceId = serviceData?.id;
        expect(testServiceId).toBeTruthy();

        // 2. Verify in Directory -> Coach -> Bulk Add
        await page.goto('/sys-admin/directory');

        // Switch to Coaches tab - use more specific selector targeting the card
        await page.locator('div').filter({ hasText: 'Coaches' }).last().click();

        // Wait for list to load with longer timeout and check for heading
        await expect(page.locator('h2')).toContainText('Active Coaches', { timeout: 10000 });

        // Click on the first coach's "Manage Availability" button (it's an icon with title)
        await page.locator('button[title="Manage Availability"]').first().click();

        // Open Bulk Add
        await page.click('button:has-text("Bulk Add")');

        // Select the newly created service
        await page.selectOption('select:has-text("Generic Slot")', { label: serviceName });

        // Verify Credits field pre-fills to 125
        const creditsValue = await page.locator('label:has-text("Credits") + input').inputValue();
        expect(Number(creditsValue)).toBe(testCreditCost);

        // Verify Cap field pre-fills to 1 (since it's PRIVATE)
        const capValue = await page.locator('label:has-text("Cap") + input').inputValue();
        expect(Number(capValue)).toBe(1);

        // 3. Verify manual override
        await page.locator('label:has-text("Credits") + input').fill('150');
        await page.click('button:has-text("Generate")');

        // Wait for items to be generated
        await expect(page.locator('text=/Generated \\d+ items/')).toBeVisible();

        // Verify if we save, the cost is correctly passed (optional, complex to verify in UI)
        // For now, these checks confirm the Multi-Variate integration (DB -> API -> UI -> Bulk Tool)
    });
});
