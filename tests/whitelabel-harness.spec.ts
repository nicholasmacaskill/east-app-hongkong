import { test, expect } from '@playwright/test';

test.describe('White-Label Harness & Multi-Brand Theming', () => {
  test('default tenant should load EAST Sports Group branding & neon green theme', async ({ page }) => {
    // Clear any previous preview state in localStorage
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.goto('/');

    // 1. Verify CSS custom properties on :root
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim();
    });
    expect(primaryColor.toLowerCase()).toBe('#28d160');

    // 2. Verify data-tenant attribute
    const tenantAttr = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-tenant');
    });
    expect(tenantAttr).toBe('east');

    // 3. Verify Landing page logo & copy
    const logoImg = page.locator('img[alt="EAST Sports Group"]');
    await expect(logoImg).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=East Sports Group • Hong Kong')).toBeVisible();
  });

  test('URL query ?tenant=jrducks should dynamically skin to Anaheim Jr. Ducks', async ({ page }) => {
    await page.goto('/?tenant=jrducks');

    // 1. Verify CSS custom property switched to Ducks Orange
    await expect.poll(async () => {
      return await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim().toLowerCase();
      });
    }).toBe('#f47a38');

    // 2. Verify data-tenant attribute
    await expect.poll(async () => {
      return await page.evaluate(() => {
        return document.documentElement.getAttribute('data-tenant');
      });
    }).toBe('jrducks');

    // 3. Verify Jr Ducks logo & copy
    const logoImg = page.locator('img[alt="Anaheim Jr. Ducks Hockey"]');
    await expect(logoImg).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Anaheim Jr. Ducks • Anaheim, California, USA')).toBeVisible();

    // 4. Verify Page Title
    await expect(page).toHaveTitle(/Anaheim Jr\. Ducks/);
  });

  test('interactive TenantSwitcher widget should hot-swap themes on the fly', async ({ page }) => {
    await page.goto('/');

    // 1. Open the TenantSwitcher widget
    const toggleBtn = page.locator('[data-testid="tenant-switcher-toggle"]');
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
    await toggleBtn.click();

    // 2. Switch to Anaheim Jr. Ducks
    const jrDucksBtn = page.locator('[data-testid="tenant-switch-jrducks"]');
    await expect(jrDucksBtn).toBeVisible();
    await jrDucksBtn.click();

    // 3. Immediately assert CSS primary color changed to Ducks Orange without full page reload
    await expect.poll(async () => {
      return await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim().toLowerCase();
      });
    }).toBe('#f47a38');

    // Assert Jr Ducks logo is now rendered
    await expect(page.locator('img[alt="Anaheim Jr. Ducks Hockey"]')).toBeVisible();

    // 4. Switch back to EAST Sports Group
    const eastBtn = page.locator('[data-testid="tenant-switch-east"]');
    await expect(eastBtn).toBeVisible();
    await eastBtn.click();

    // Assert color switched back to EAST green
    await expect.poll(async () => {
      return await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim().toLowerCase();
      });
    }).toBe('#28d160');

    await expect(page.locator('img[alt="EAST Sports Group"]')).toBeVisible();
  });
});
