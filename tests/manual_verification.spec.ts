import { test, expect } from '@playwright/test';

const BASE_URL = 'https://east-app-hk.vercel.app';

const ACCOUNTS = [
    { email: 'qaben@east.com', password: 'EastQA_Ben2026!', portal: 'ADMIN PORTAL', expectedUrl: /\/sys-admin/ },
    { email: 'admin@east.com', password: 'password123', portal: 'ADMIN PORTAL', expectedUrl: /\/sys-admin/ },
    { email: 'parent@east.com', password: 'DemoParent2026!', portal: 'PARENT PORTAL', expectedUrl: /\// },
    { email: 'parent@example.com', password: 'password123', portal: 'PARENT PORTAL', expectedUrl: /\// },
    { email: 'coach@east.com', password: 'DemoCoach2026!', portal: 'COACH PORTAL', expectedUrl: /\// },
    { email: 'player@east.com', password: 'DemoPlayer2026!', portal: 'ATHLETE PORTAL', expectedUrl: /\// },
];

test.describe('E2E Login Verification', () => {
    for (const acc of ACCOUNTS) {
        test(`Verify Login: ${acc.email} (${acc.portal})`, async ({ page }) => {
            console.log(`Testing ${acc.email}...`);
            await page.goto(BASE_URL);
            
            // Wait for splash screen and click the portal
            const portalButton = page.locator(`button:has-text("${acc.portal}")`);
            await portalButton.scrollIntoViewIfNeeded();
            await portalButton.click();

            // Fill login form
            await page.fill('input[name="email"]', acc.email);
            await page.fill('input[name="password"]', acc.password);
            
            // Wait for potential rate limits or slow responses
            await Promise.all([
                page.click('button:has-text("LOGIN")'),
                page.waitForResponse(resp => resp.url().includes('/auth/v1/token'), { timeout: 10000 }).catch(() => null)
            ]);

            // Check for success via URL or presence of logout/dashboard
            try {
                await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
                // If it's the admin portal, it should be at /sys-admin or similar
                if (acc.expectedUrl) {
                    await expect(page).toHaveURL(acc.expectedUrl, { timeout: 5000 });
                }
                console.log(`✅ SUCCESS: ${acc.email}`);
            } catch (e) {
                console.log(`❌ FAILED: ${acc.email} - Invalid credentials or timeout`);
                throw e; // Fail the test
            }
        });
    }
});
