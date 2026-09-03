/**
 * AppHeader Button Clickability Test
 * ------------------------------------
 * Verifies that every button in AppHeader is:
 *   1. Visible (not clipped, hidden, or off-screen)
 *   2. Clickable (pointer events enabled, non-zero bounding box)
 *   3. Functionally responsive (triggers expected navigation/state change)
 *
 * Runs on both Desktop (1280×800) and Mobile (390×844 - iPhone 14) viewports.
 * Tests a "parent" role user so the messenger icon is rendered (not bypassed).
 */

import { test, expect, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    // Wait for home screen — identified by the CREDITS pill appearing
    await page.waitForSelector('[data-testid="credits-button"]', { timeout: 30000 });
}

async function assertButtonClickable(page: Page, selector: string, label: string) {
    const el = page.locator(selector).first();
    // 1. Visible
    await expect(el, `${label}: not visible`).toBeVisible({ timeout: 8000 });

    // 2. Non-zero bounding box (not clipped/collapsed)
    const box = await el.boundingBox();
    expect(box, `${label}: bounding box is null (element off-screen or display:none)`).not.toBeNull();
    expect(box!.width, `${label}: width is zero`).toBeGreaterThan(0);
    expect(box!.height, `${label}: height is zero`).toBeGreaterThan(0);

    // 3. Pointer events (not obscured by an overlay)
    const isClickable = await el.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const topEl = document.elementFromPoint(cx, cy);
        return topEl === el || el.contains(topEl);
    });
    expect(isClickable, `${label}: pointer events blocked by overlay`).toBe(true);
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

test.describe('AppHeader — All Buttons Clickable', () => {
    let parentId: string;
    let parentEmail: string;
    const password = 'HeaderTest123!';

    test.beforeAll(async () => {
        const unique = Math.random().toString(36).substring(7);
        parentEmail = `hdr-parent-${unique}@east.com`;

        const { data, error } = await supabase.auth.admin.createUser({
            email: parentEmail,
            password,
            email_confirm: true,
            user_metadata: { role: 'parent', first_name: 'Header', last_name: 'Tester' }
        });
        if (error || !data.user) throw error ?? new Error('Failed to create test user');
        parentId = data.user.id;

        // Ensure profile row exists with active subscription so credits pill shows
        await supabase.from('profiles').upsert({
            id: parentId,
            role: 'parent',
            first_name: 'Header',
            last_name: 'Tester',
            credits: 50,
            subscription_status: 'active',
            account_status: 'active'
        });
    });

    test.afterAll(async () => {
        if (parentId) await supabase.auth.admin.deleteUser(parentId);
    });

    // ── Desktop ──────────────────────────────────────────────────────────────
    test.describe('Desktop (1280×800)', () => {
        test.use({ viewport: { width: 1280, height: 800 } });

        test('Credits pill is visible and clickable', async ({ page }) => {
            await loginAs(page, parentEmail, password);
            await assertButtonClickable(page, '[data-testid="credits-button"]', 'Credits pill');
        });

        test('Messenger icon navigates to community tab', async ({ page }) => {
            await loginAs(page, parentEmail, password);
            const messengerBtn = page.locator('button[title="Messages"]');
            await assertButtonClickable(page, 'button[title="Messages"]', 'Messenger icon (desktop)');

            // Click and verify the Community/Messenger screen appears
            await messengerBtn.click();
            await expect(page.locator('h1').filter({ hasText: /MESSENGER/i }).first())
                .toBeVisible({ timeout: 10000 });
        });

        test('Trophy icon navigates to /stats', async ({ page }) => {
            await loginAs(page, parentEmail, password);
            await assertButtonClickable(page, 'a[href="/stats"]', 'Trophy/Stats link (desktop)');
            await page.click('a[href="/stats"]');
            await page.waitForURL(/.*stats/, { timeout: 15000 });
            expect(page.url()).toContain('/stats');
        });

        test('Settings button opens settings panel', async ({ page }) => {
            await loginAs(page, parentEmail, password);
            await assertButtonClickable(page, '[data-testid="settings-button"]', 'Settings button (desktop)');
            await page.click('[data-testid="settings-button"]');
            // Settings panel/modal should appear — look for "Settings" heading or "Save" button
            await expect(
                page.locator('text=Settings').or(page.locator('text=SETTINGS')).or(page.locator('text=Profile')).first()
            ).toBeVisible({ timeout: 8000 });
        });

        test('Help (FAQ) icon navigates to /faq', async ({ page }) => {
            await loginAs(page, parentEmail, password);
            await assertButtonClickable(page, 'a[href="/faq"]', 'FAQ/Help link (desktop)');
            await page.click('a[href="/faq"]');
            await page.waitForURL(/.*faq/, { timeout: 15000 });
            expect(page.url()).toContain('/faq');
        });
    });

    // ── Mobile (iPhone 14) ────────────────────────────────────────────────────
    test.describe('Mobile (390×844 — iPhone 14)', () => {
        test.use({ viewport: { width: 390, height: 844 } });

        test('[MOBILE] Credits pill is visible and clickable', async ({ page }) => {
            await loginAs(page, parentEmail, password);
            await assertButtonClickable(page, '[data-testid="credits-button"]', 'Credits pill (mobile)');
        });

        test('[MOBILE] Messenger icon is visible and clickable — regression test for hidden icon', async ({ page }) => {
            await loginAs(page, parentEmail, password);

            const messengerBtn = page.locator('button[title="Messages"]');

            // Visibility check
            await expect(messengerBtn, 'Messenger icon must be visible on mobile').toBeVisible({ timeout: 8000 });

            // Bounding box — must have real dimensions (was previously clipped to zero)
            const box = await messengerBtn.boundingBox();
            expect(box, 'Messenger icon bounding box is null — still clipped!').not.toBeNull();
            expect(box!.width, 'Messenger icon width is 0 — still hidden!').toBeGreaterThan(0);
            expect(box!.height, 'Messenger icon height is 0 — still hidden!').toBeGreaterThan(0);

            // Must be within viewport horizontally (not overflowing off-screen)
            expect(box!.x + box!.width, 'Messenger icon overflows the right edge of viewport').toBeLessThanOrEqual(395);
            expect(box!.x, 'Messenger icon is off the left edge of viewport').toBeGreaterThanOrEqual(0);

            console.log(`✅ Messenger icon bounding box on mobile: x=${box!.x}, y=${box!.y}, w=${box!.width}, h=${box!.height}`);

            // Click and verify messenger opens
            await messengerBtn.click();
            await expect(page.locator('h1').filter({ hasText: /MESSENGER/i }).first())
                .toBeVisible({ timeout: 10000 });
        });

        test('[MOBILE] Trophy icon is visible and clickable', async ({ page }) => {
            await loginAs(page, parentEmail, password);
            await assertButtonClickable(page, 'a[href="/stats"]', 'Trophy/Stats link (mobile)');

            const box = await page.locator('a[href="/stats"]').first().boundingBox();
            expect(box!.x + box!.width).toBeLessThanOrEqual(395); // not off-screen right
        });

        test('[MOBILE] Settings button is visible and clickable', async ({ page }) => {
            await loginAs(page, parentEmail, password);
            await assertButtonClickable(page, '[data-testid="settings-button"]', 'Settings button (mobile)');
        });

        test('[MOBILE] FAQ/Help icon is visible and clickable', async ({ page }) => {
            await loginAs(page, parentEmail, password);
            await assertButtonClickable(page, 'a[href="/faq"]', 'FAQ/Help link (mobile)');

            const box = await page.locator('a[href="/faq"]').first().boundingBox();
            expect(box!.x + box!.width).toBeLessThanOrEqual(395); // not off-screen right
        });

        test('[MOBILE] No horizontal overflow in header', async ({ page }) => {
            await loginAs(page, parentEmail, password);
            const overflow = await page.evaluate(() =>
                document.documentElement.scrollWidth > window.innerWidth
            );
            expect(overflow, 'Header causes horizontal page overflow on mobile').toBe(false);
        });

        test('[MOBILE] All 4 header icons are within viewport bounds', async ({ page }) => {
            await loginAs(page, parentEmail, password);
            const viewportWidth = 390;

            const icons = [
                { selector: 'button[title="Messages"]', label: 'Messenger' },
                { selector: 'a[href="/stats"]',         label: 'Trophy' },
                { selector: '[data-testid="settings-button"]', label: 'Settings' },
                { selector: 'a[href="/faq"]',           label: 'FAQ' },
            ];

            for (const icon of icons) {
                const el = page.locator(icon.selector).first();
                await expect(el, `${icon.label} not visible`).toBeVisible({ timeout: 8000 });
                const box = await el.boundingBox();
                expect(box, `${icon.label} bounding box null`).not.toBeNull();
                expect(box!.x, `${icon.label} left edge < 0`).toBeGreaterThanOrEqual(0);
                expect(box!.x + box!.width, `${icon.label} right edge > viewport`).toBeLessThanOrEqual(viewportWidth + 5); // +5px tolerance
                console.log(`  ${icon.label}: x=${box!.x.toFixed(1)}, right=${(box!.x + box!.width).toFixed(1)}`);
            }
        });
    });

    // ── Small Mobile (iPhone SE — 375×667) ───────────────────────────────────
    test.describe('Small Mobile (375×667 — iPhone SE)', () => {
        test.use({ viewport: { width: 375, height: 667 } });

        test('[SE] All 4 header icons visible and in-bounds on smallest common screen', async ({ page }) => {
            await loginAs(page, parentEmail, password);
            const viewportWidth = 375;

            const icons = [
                { selector: 'button[title="Messages"]', label: 'Messenger (SE)' },
                { selector: 'a[href="/stats"]',         label: 'Trophy (SE)' },
                { selector: '[data-testid="settings-button"]', label: 'Settings (SE)' },
                { selector: 'a[href="/faq"]',           label: 'FAQ (SE)' },
            ];

            for (const icon of icons) {
                const el = page.locator(icon.selector).first();
                await expect(el, `${icon.label} not visible on SE`).toBeVisible({ timeout: 8000 });
                const box = await el.boundingBox();
                expect(box, `${icon.label} null bounding box on SE`).not.toBeNull();
                expect(box!.x + box!.width, `${icon.label} overflows viewport on SE`).toBeLessThanOrEqual(viewportWidth + 5);
                console.log(`  ${icon.label}: w=${box!.width.toFixed(1)}, right=${(box!.x + box!.width).toFixed(1)}`);
            }
        });
    });
});
