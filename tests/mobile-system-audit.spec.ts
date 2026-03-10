import { test, expect } from '@playwright/test';
import { discoverRoutes } from '../scripts/discover-routes';
import { MobileAuditEngine } from './utils/mobile-audit-engine';
import path from 'path';

const appDir = path.join(process.cwd(), 'app');
const allRoutes = discoverRoutes(appDir);

// Filter routes handled by specific auth states or that are known to be problematic/dynamic
const targetRoutes = allRoutes.filter(route =>
    !route.includes('login') &&
    !route.includes('register') &&
    !route.includes('unauthorized')
);

// We run this across different mobile projects defined in playwright.config.ts
test.describe('Global Mobile System Audit', () => {

    for (const route of targetRoutes) {
        test(`Audit Route: ${route}`, async ({ page }) => {
            const audit = new MobileAuditEngine(page);

            // 1. Navigate to route
            console.log(`Auditing: ${route}`);
            await page.goto(route);

            // 2. Wait for network idle to ensure full render
            await page.waitForLoadState('networkidle');
            // Additional buffer for animations/dynamic jank
            await page.waitForTimeout(1000);

            // 3. Run Audit Checks
            await test.step('Check Horizontal Overflow', async () => {
                await audit.checkOverflow();
            });

            await test.step('Check CSS Optimality', async () => {
                await audit.checkCSSOptimality();
            });

            await test.step('Check Layout Stability (CLS)', async () => {
                await audit.checkLayoutStability();
            });

            // 4. Capture Visual Snapshot
            const safeName = route.replace(/\//g, '-').replace(/^-/, '') || 'root';
            await expect(page).toHaveScreenshot(`${safeName}.png`, {
                fullPage: true,
                maxDiffPixelRatio: 0.05 // Support minor rendering variations
            });
        });
    }
});

/**
 * Performance-focused test with Network Throttling
 */
test.describe('Mobile Performance Audit (Slow 4G)', () => {
    test.use({
        // Simulated Slow 4G
        // Download: 1.6 Mbps, Upload: 0.75 Mbps, Latency: 150ms
    });

    test('Audit Dashboard under Network Pressure', async ({ page }) => {
        const audit = new MobileAuditEngine(page);

        // Setup CDP session for throttling
        const client = await page.context().newCDPSession(page);
        await client.send('Network.emulateNetworkConditions', {
            offline: false,
            downloadThroughput: 1.6 * 1024 * 1024 / 8,
            uploadThroughput: 0.75 * 1024 * 1024 / 8,
            latency: 150,
        });

        await page.goto('/');
        await audit.checkLayoutStability();

        // Verify no elements are "clipped" during slow load
        const clipped = await page.evaluate(() => {
            const els = document.querySelectorAll('*');
            return Array.from(els).some(el => {
                const style = window.getComputedStyle(el);
                return style.overflow === 'hidden' && el.scrollHeight > el.clientHeight;
            });
        });
        // This is a soft check for content cutting
        if (clipped) console.warn('Possible content clipping detected during slow load');
    });
});
