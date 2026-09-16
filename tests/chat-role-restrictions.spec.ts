import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Chat & Messenger Role Boundaries', () => {
    let coachId: string;
    let parentId: string;
    let otherParentId: string;
    let playerId: string;

    const password = 'TestPassword123!';
    const timestamp = Date.now();

    const coachEmail = `test-coach-${timestamp}@pw.test`;
    const parentEmail = `test-parent-${timestamp}@pw.test`;
    const otherParentEmail = `test-otherparent-${timestamp}@pw.test`;
    const playerEmail = `test-player-${timestamp}@pw.test`;

    test.beforeAll(async () => {
        // 1. Create Coach
        const { data: coachUser } = await supabase.auth.admin.createUser({
            email: coachEmail,
            password,
            email_confirm: true,
            user_metadata: { role: 'coach', first_name: 'Coach', last_name: `Alex${timestamp}` }
        });
        coachId = coachUser!.user!.id;
        await supabase.from('profiles').upsert({
            id: coachId,
            role: 'coach',
            first_name: 'Coach',
            last_name: `Alex${timestamp}`,
            contact_email: coachEmail
        });

        // 2. Create Parent A
        const { data: parentUser } = await supabase.auth.admin.createUser({
            email: parentEmail,
            password,
            email_confirm: true,
            user_metadata: { role: 'parent', first_name: 'ParentA', last_name: `User${timestamp}` }
        });
        parentId = parentUser!.user!.id;
        await supabase.from('profiles').upsert({
            id: parentId,
            role: 'parent',
            first_name: 'ParentA',
            last_name: `User${timestamp}`,
            contact_email: parentEmail,
            subscription_status: 'active',
            account_status: 'active'
        });

        // 3. Create Parent B
        const { data: otherParentUser } = await supabase.auth.admin.createUser({
            email: otherParentEmail,
            password,
            email_confirm: true,
            user_metadata: { role: 'parent', first_name: 'ParentB', last_name: `User${timestamp}` }
        });
        otherParentId = otherParentUser!.user!.id;
        await supabase.from('profiles').upsert({
            id: otherParentId,
            role: 'parent',
            first_name: 'ParentB',
            last_name: `User${timestamp}`,
            contact_email: otherParentEmail
        });

        // 4. Create Player
        const { data: playerUser } = await supabase.auth.admin.createUser({
            email: playerEmail,
            password,
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'AthleteA', last_name: `Kid${timestamp}` }
        });
        playerId = playerUser!.user!.id;
        await supabase.from('profiles').upsert({
            id: playerId,
            role: 'player',
            first_name: 'AthleteA',
            last_name: `Kid${timestamp}`,
            contact_email: playerEmail
        });
    });

    test.afterAll(async () => {
        const ids = [coachId, parentId, otherParentId, playerId].filter(Boolean);
        for (const id of ids) {
            await supabase.from('messages').delete().or(`sender_id.eq.${id},receiver_id.eq.${id}`);
            await supabase.from('profiles').delete().eq('id', id);
            await supabase.auth.admin.deleteUser(id).catch(() => null);
        }
    });

    test('Regular Parent should only see Coaches in DM list and not other Parents or Athletes', async ({ page }) => {
        // Login as Parent A
        await page.goto('/login');
        await page.fill('input[type="email"]', parentEmail);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForSelector('[data-testid="credits-button"]', { timeout: 20000 });

        // Navigate to Community / Messages
        await page.click('button[title="Messages"]');
        await page.waitForSelector('text=Direct Messages', { timeout: 15000 });

        // Coach should be visible in Direct Messages list
        await expect(page.locator(`text=Coach Alex${timestamp}`).first()).toBeVisible();

        // Other parent and athlete should NOT be in the Direct Messages list
        await expect(page.locator(`text=ParentB User${timestamp}`)).toHaveCount(0);
        await expect(page.locator(`text=AthleteA Kid${timestamp}`)).toHaveCount(0);

        // Search placeholder should reflect coach-only search
        const searchInput = page.locator('input[placeholder="Search teams or coaches..."]');
        await expect(searchInput).toBeVisible();
    });

    test('Attempting to direct message another parent or athlete via URL param is blocked', async ({ page }) => {
        // Login as Parent A
        await page.goto('/login');
        await page.fill('input[type="email"]', parentEmail);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForSelector('[data-testid="credits-button"]', { timeout: 20000 });

        // Direct navigate to chat with another parent
        await page.goto(`/?tab=community&chatWith=${otherParentId}`);

        // Should stay on or revert to list without opening chat with other parent
        await expect(page.locator(`text=Direct Messages`)).toBeVisible({ timeout: 15000 });
        await expect(page.locator(`text=ParentB User${timestamp}`)).toHaveCount(0);
    });
});
