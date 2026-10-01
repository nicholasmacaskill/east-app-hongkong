import { test as base, Page } from '@playwright/test';
import path from 'path';

export type RoleFixtures = {
    coachPage: Page;
    playerPage: Page;
    parentPage: Page;
    adminPage: Page;
};

/**
 * Extended Playwright test object pre-wired with authenticated contexts
 * for all 4 EAST Sports Group user roles: Coach, Player, Parent, Sys-Admin.
 */
export const test = base.extend<RoleFixtures>({
    coachPage: async ({ browser }, use) => {
        const context = await browser.newContext({
            storageState: path.resolve(process.cwd(), 'playwright/.auth/coach.json')
        });
        const page = await context.newPage();
        await use(page);
        await context.close();
    },
    playerPage: async ({ browser }, use) => {
        const context = await browser.newContext({
            storageState: path.resolve(process.cwd(), 'playwright/.auth/player.json')
        });
        const page = await context.newPage();
        await use(page);
        await context.close();
    },
    parentPage: async ({ browser }, use) => {
        const context = await browser.newContext({
            storageState: path.resolve(process.cwd(), 'playwright/.auth/user.json')
        });
        const page = await context.newPage();
        await use(page);
        await context.close();
    },
    adminPage: async ({ browser }, use) => {
        const context = await browser.newContext({
            storageState: path.resolve(process.cwd(), 'playwright/.auth/admin.json')
        });
        const page = await context.newPage();
        await use(page);
        await context.close();
    }
});

export { expect } from '@playwright/test';
