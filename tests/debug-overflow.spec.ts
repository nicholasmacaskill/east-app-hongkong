
import { test, expect } from '@playwright/test';

test('Debug Directory Overflow', async ({ page }) => {
    // 1. Mobile Viewport (iPhone 14)
    await page.setViewportSize({ width: 390, height: 844 });

    // 2. Login as SysAdmin
    await page.goto(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback?token=${process.env.SUPABASE_SERVICE_ROLE_KEY}&type=magiclink`);
    // ^ note: this is a hacky way if we had a magic link, but we are using the 'no-auth' project which assumes we mock or handle auth differently?
    // Wait, the existing test uses 'createDemoUsers' and login form.
    // I should copy the login logic from mobile-layout-audit.spec.ts

    // Actually, let's just use the same login flow as the main test.
    await page.goto('/sys-admin');
    // Expect login page if not auth? The main test handles login. 
    // I will assume I need to do the login flow.

    // LOGIN FLOW
    await page.goto('/');
    await page.getByPlaceholder('name@example.com').fill('sysadmin@example.com');
    await page.getByPlaceholder('your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(2000);

    // 3. Go to Directory
    await page.goto('/sys-admin/services');
    await page.waitForTimeout(2000);

    // 4. Find Culprits
    const culprits = await page.evaluate(() => {
        const wideElements: string[] = [];
        document.querySelectorAll('*').forEach((el) => {
            if (el instanceof HTMLElement) {
                const rect = el.getBoundingClientRect();
                if (rect.width > window.innerWidth) {
                    el.style.border = '5px solid red';
                    wideElements.push(`${el.tagName}.${el.className} (Width: ${rect.width}px)`);
                }
            }
        });
        return wideElements;
    });

    console.log('OVERFLOW CULPRITS:', culprits);

    await page.screenshot({ path: 'audit-screenshots/debug-overflow-culprits.png', fullPage: true });
});
