import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Help Centre Role-Based Visibility', () => {
    let playerId: string, playerEmail: string;
    let parentId: string, parentEmail: string;
    let coachId: string, coachEmail: string;
    let adminId: string, adminEmail: string;
    const password = 'TestPassword123!';

    test.beforeAll(async () => {
        const unique = Math.random().toString(36).substring(7);
        
        const roles = ['player', 'parent', 'coach', 'admin'];
        const users = await Promise.all(roles.map(async (role) => {
            const email = `test-faq-${role}-${unique}@east.com`;
            // Delete if exists
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existing = existingUsers.users.find(u => u.email === email);
            if (existing) await supabase.auth.admin.deleteUser(existing.id);

            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { role, first_name: 'Test', last_name: role }
            });
            if (error) throw error;
            await supabase.from('profiles').upsert({
                id: data.user!.id,
                role,
                first_name: 'Test',
                last_name: role,
                contact_email: email,
                account_status: 'ACTIVE'
            });
            return { id: data.user!.id, email };
        }));

        [playerId, playerEmail] = [users[0].id, users[0].email];
        [parentId, parentEmail] = [users[1].id, users[1].email];
        [coachId, coachEmail] = [users[2].id, users[2].email];
        [adminId, adminEmail] = [users[3].id, users[3].email];
    });

    test.afterAll(async () => {
        const ids = [playerId, parentId, coachId, adminId];
        await Promise.all(ids.map(id => id && supabase.auth.admin.deleteUser(id)));
    });

    const loginAndGoToFAQ = async (page: any, email: string) => {
        page.on('console', (msg: any) => {
            const text = msg.text();
            if (text.includes('[HELP_CENTRE]')) {
                console.log('BROWSER:', text);
            }
        });
        await page.goto('/login');
        await page.fill('input[placeholder="Enter your email"]', email);
        await page.fill('input[placeholder="Enter your password"]', password);
        await page.click('button:has-text("Login")');
        // Wait for either home or portal and then go to faq
        await page.waitForURL((url: any) => url.pathname === '/' || url.pathname === '/sys-admin', { timeout: 30000 });
        await page.goto('/faq');
        // Wait for skeleton to appear and then disappear (ensure role fetch starts)
        await page.waitForSelector('.animate-pulse', { state: 'detached', timeout: 30000 });
        await page.waitForSelector('h1', { timeout: 30000 });
    };

    test('Player: Sees only Player content, no tabs', async ({ page }) => {
        await loginAndGoToFAQ(page, playerEmail);
        await expect(page.locator('button:has-text("Player")')).not.toBeVisible();
        await expect(page.locator('text=/How do I log in?/i')).toBeVisible();
    });

    test('Parent: Sees Player and Parent tabs', async ({ page }) => {
        await loginAndGoToFAQ(page, parentEmail);
        await expect(page.locator('button:has-text("Player")')).toBeVisible();
        await expect(page.locator('button:has-text("Parent")')).toBeVisible();
        await expect(page.locator('button:has-text("Coach")')).not.toBeVisible();
    });

    test('Coach: Sees Player and Coach tabs', async ({ page }) => {
        await loginAndGoToFAQ(page, coachEmail);
        await expect(page.locator('button:has-text("Player")')).toBeVisible();
        await expect(page.locator('button:has-text("Coach")')).toBeVisible();
        await expect(page.locator('button:has-text("Parent")')).not.toBeVisible();
    });

    test('Admin: Sees all tabs', async ({ page }) => {
        await loginAndGoToFAQ(page, adminEmail);
        await expect(page.locator('button:has-text("Player")')).toBeVisible();
        await expect(page.locator('button:has-text("Parent")')).toBeVisible();
        await expect(page.locator('button:has-text("Coach")')).toBeVisible();
        await expect(page.locator('button:has-text("Admin")')).toBeVisible();
    });

    test('Unauthenticated: Sees only Player info, no tabs', async ({ page }) => {
        await page.goto('/faq');
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('h1', { timeout: 30000 });
        await expect(page.locator('button:has-text("Player")')).not.toBeVisible();
        await expect(page.locator('text=/How do I log in?/i')).toBeVisible();
    });
});
