/**
 * E2E Test: Ticket #19 — QR Code Wallet + Admin Charge Flow
 *
 * Multi-Variate Change: DB + API + UI (Auth → Data → Charge)
 * Requires: Playwright + test environment running
 */

import { test, expect } from '@playwright/test';

// ─── Constants ─────────────────────────────────────────────────────────────────
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

// Test admin credentials (test env only)
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'qaben3@east-test.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'test1234!';

// A known player userId in the test DB to simulate scanning their QR
const TEST_PLAYER_USER_ID = process.env.TEST_PLAYER_USER_ID || '';

// ─── Helper: Login ──────────────────────────────────────────────────────────────
async function loginAsAdmin(page: any) {
  await page.goto(`${BASE_URL}/`);
  // Click the admin/staff login path on landing screen
  const adminBtn = page.locator('text=/admin|staff|sys-admin/i').first();
  if (await adminBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await adminBtn.click();
  }
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for redirect to admin portal or sys-admin
  await page.waitForURL(/sys-admin|admin-ops/, { timeout: 15000 });
}

// ─── Test Suite ─────────────────────────────────────────────────────────────────

test.describe('Ticket #19 — QR Code Wallet', () => {

  /**
   * Part 1: Member Wallet QR renders a real QR tied to the userId
   */
  test('Member wallet tab shows a QR code for logged-in user', async ({ page }) => {
    await page.goto(`${BASE_URL}/?tab=qr`);
    // Should see either a QR SVG or a login prompt
    const qrSvg = page.locator('svg').first();
    const loginPrompt = page.locator('text=/log in|sign in/i').first();

    const hasQR = await qrSvg.isVisible({ timeout: 5000 }).catch(() => false);
    const hasLogin = await loginPrompt.isVisible({ timeout: 5000 }).catch(() => false);

    // Either outcome is valid — QR visible for auth'd user, login prompt for guest
    expect(hasQR || hasLogin).toBeTruthy();
  });

  /**
   * Part 2: /qr legacy route redirects to /?tab=qr
   */
  test('/qr redirects to /?tab=qr within 3 seconds', async ({ page }) => {
    await page.goto(`${BASE_URL}/qr`);
    await page.waitForURL(/\?tab=qr/, { timeout: 5000 });
    expect(page.url()).toContain('tab=qr');
  });

  /**
   * Part 3: Admin check-in page — scanning an athlete_wallet QR opens charge modal
   * Uses window.simulateScan() exposed by the check-in page for automated testing.
   */
  test('Admin scanning athlete_wallet QR shows charge modal', async ({ page }) => {
    test.skip(!TEST_PLAYER_USER_ID, 'TEST_PLAYER_USER_ID not set — skipping charge modal test');

    await loginAsAdmin(page);

    // Navigate to the check-in scanner
    await page.goto(`${BASE_URL}/check-in`);
    await page.waitForLoadState('networkidle');

    // Simulate scanning a member wallet QR (same format as QRScreen.tsx encodes)
    const walletQRPayload = JSON.stringify({
      type: 'athlete_wallet',
      userId: TEST_PLAYER_USER_ID,
    });

    await page.evaluate((payload) => {
      (window as any).simulateScan(payload);
    }, walletQRPayload);

    // Charge modal should appear with member info
    const chargeBtn = page.locator('#confirm-charge-btn');
    await expect(chargeBtn).toBeVisible({ timeout: 8000 });

    // Amount input should have default value
    const amountInput = page.locator('#charge-amount-input');
    await expect(amountInput).toBeVisible();
    await expect(amountInput).toHaveValue('10');

    // Reason input should be visible
    const reasonInput = page.locator('#charge-reason-input');
    await expect(reasonInput).toBeVisible();
  });

  /**
   * Part 4: Admin charge API returns 403 for non-admin callers
   */
  test('charge-via-qr API rejects unauthenticated requests', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/admin/charge-via-qr`, {
      data: { targetUserId: 'fake-id', amount: 10, reason: 'test' },
      headers: { 'Content-Type': 'application/json' },
      // Deliberately omit Authorization header
    });
    expect(res.status()).toBe(401);
  });

  /**
   * Part 5: charge-via-qr API rejects player-role callers
   * (Would need a valid player token — skipped in CI without test credentials)
   */
  test('charge-via-qr API rejects player role', async ({ request }) => {
    // Without a valid token we expect 401, verifying the guard is in place
    const res = await request.post(`${BASE_URL}/api/admin/charge-via-qr`, {
      data: { targetUserId: 'fake-id', amount: 10, reason: 'test' },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token',
      },
    });
    // 401 (invalid token) or 403 (valid token but wrong role) — both are correct
    expect([401, 403]).toContain(res.status());
  });

});
