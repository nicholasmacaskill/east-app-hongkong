import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe.configure({ mode: 'serial' });

test.describe('Admin Events & Public Visibility', () => {
    let adminId: string;
    let playerId: string;
    const uniqueSuffix = Date.now();
    const adminEmail = `admin-event-${uniqueSuffix}@east.com`;
    const playerEmail = `player-event-${uniqueSuffix}@east.com`;
    const adminPassword = 'TestAdminPassword123!';
    const playerPassword = 'TestPlayerPassword123!';
    const eventTitle = `Championship Final ${uniqueSuffix}`;

    test.beforeAll(async () => {
        // 1. Create Admin User
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'Super', last_name: 'Admin' }
        });
        if (adminError) throw adminError;
        adminId = adminData.user.id;
        await supabase.from('profiles').upsert({ id: adminId, role: 'sys-admin', first_name: 'Super', last_name: 'Admin' });

        // 2. Create Player User
        const { data: playerData, error: playerError } = await supabase.auth.admin.createUser({
            email: playerEmail,
            password: playerPassword,
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'Event', last_name: 'Watcher' }
        });
        if (playerError) throw playerError;
        playerId = playerData.user.id;
        await supabase.from('profiles').upsert({ id: playerId, role: 'player', first_name: 'Event', last_name: 'Watcher' });
    });

    test.afterAll(async () => {
        if (adminId) await supabase.auth.admin.deleteUser(adminId);
        if (playerId) await supabase.auth.admin.deleteUser(playerId);
        // Clean up announcement
        await supabase.from('announcements').delete().ilike('title', `%${uniqueSuffix}%`);
    });

    test('Full Flow: Admin Creates Event -> Player Sees It', async ({ browser }) => {
        // --- ADMIN CONTEXT ---
        const adminContext = await browser.newContext();
        const adminPage = await adminContext.newPage();

        // 1. Login as Admin
        await adminPage.goto('/login');
        await adminPage.fill('input[type="email"]', adminEmail);
        await adminPage.fill('input[type="password"]', adminPassword);
        await adminPage.click('button[type="submit"]');
        await adminPage.waitForURL(/.*sys-admin/, { timeout: 15000 });

        // 2. Go to News Management
        await adminPage.goto('/sys-admin/news');
        await expect(adminPage.locator('h1:has-text("News Management")')).toBeVisible();

        // 3. Create Event
        await adminPage.click('button:has-text("Add Announcement")');

        // Select "Event" Type
        await adminPage.selectOption('select', 'event');

        // Fill Details
        await adminPage.fill('input[placeholder*="headline"]', eventTitle);
        await adminPage.fill('textarea[placeholder*="story"]', 'This is a test event visible to players.');

        // Set Date (Tomorrow)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        await adminPage.fill('input[type="date"]', dateStr);

        // Publish
        await adminPage.check('input#published');
        await adminPage.click('button:has-text("Save Story")');

        // Verify in Admin List (look for Event badge logic or just title)
        await expect(adminPage.locator(`text=${eventTitle}`)).toBeVisible();

        await adminContext.close();

        // --- PLAYER CONTEXT ---
        const playerContext = await browser.newContext();
        const playerPage = await playerContext.newPage();

        // 4. Login as Player
        await playerPage.goto('/login');
        await playerPage.fill('input[type="email"]', playerEmail);
        await playerPage.fill('input[type="password"]', playerPassword);
        await playerPage.click('button[type="submit"]');
        await playerPage.waitForURL('/', { timeout: 15000 });

        // 5. Verify Event Visibility on Dashboard
        // Dashboard usually has a "Latest Updates" or similar section.
        // We verify the title exists.
        await expect(playerPage.locator(`text=${eventTitle}`)).toBeVisible();

        // Verify it is styled as an event (optional, checks for date icon or text)
        // Usually date is displayed for events.
        // We handle locale diffs by just ensuring it's visible.

        await playerContext.close();
    });
});
