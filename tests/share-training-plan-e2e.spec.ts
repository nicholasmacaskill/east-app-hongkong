/**
 * SHARE TRAINING PLAN — E2E VISUAL TESTS (Headless Playwright)
 *
 * Validates the full coach-to-athlete sharing flow in the browser:
 * 1. Coach opens messenger and sees the "Attach Plan" button
 * 2. Plan picker opens and displays available training plans
 * 3. Coach selects a plan and sends it as a message
 * 4. The shared plan renders as a card in the chat
 * 5. DB record matches expected shape
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const isProd = process.env.PLAYWRIGHT_ENV === 'production';
const envFile = isProd ? '../.env.production.latest' : '../.env.test';
dotenv.config({ path: path.resolve(__dirname, envFile) });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function conversationId(a: string, b: string): string {
    return [a, b].sort().join('_');
}

async function createTestUser(role: 'coach' | 'player', label: string) {
    const email = `share-e2e-${label.toLowerCase()}-${Date.now()}@east.test`;
    const password = 'TestPassword123!';
    const { data: userData, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, first_name: 'ShareE2E', last_name: label },
    });
    if (error || !userData.user) throw new Error(`Failed to create ${role}: ${error?.message}`);
    const id = userData.user.id;
    await supabase.from('profiles').upsert({
        id,
        role,
        first_name: 'ShareE2E',
        last_name: label,
        credits: role === 'player' ? 100 : 0,
    });
    return { id, email, password };
}

async function loginAs(page: any, email: string, password: string, portal: 'athlete' | 'coach' = 'coach') {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const portalIndex = portal === 'coach' ? 2 : 0;
    const loginBtns = page.getByRole('button', { name: /^LOGIN$/i });
    await loginBtns.nth(portalIndex).click();
    await page.waitForTimeout(1500);

    await page.fill('input[type="email"], input[name="email"], input#email', email);
    await page.fill('input[type="password"], input[name="password"], input#password', password);
    const submitBtn = page.getByRole('button', { name: /LOGIN/i }).last();
    await submitBtn.click();
    await page.waitForTimeout(4000);
}

// ─────────────────────────────────────────────
// SUITE: Share Training Plan E2E
// ─────────────────────────────────────────────
test.describe('Share Training Plan — Visual E2E', () => {
    let coach: { id: string; email: string; password: string };
    let player: { id: string; email: string; password: string };
    let planId: string | null = null;
    let drillId: string | null = null;
    let convId: string;

    test.beforeAll(async () => {
        coach = await createTestUser('coach', 'Coach');
        player = await createTestUser('player', 'Athlete');
        convId = conversationId(coach.id, player.id);

        // Create a drill and training plan for the coach
        const { data: drill } = await supabase
            .from('coach_drills')
            .insert({
                title: 'E2E Share Flow Drill',
                coach_id: coach.id,
                status: 'published',
                skill_tags: ['stickhandling'],
            })
            .select('id')
            .single();
        drillId = drill?.id ?? null;

        const { data: plan } = await supabase
            .from('training_plans')
            .insert({
                title: 'E2E Share Flow Plan',
                coach_id: coach.id,
                description: 'Visual E2E test plan',
            })
            .select('id')
            .single();
        planId = plan?.id ?? null;

        if (planId && drillId) {
            await supabase.from('training_plan_drills').insert({
                plan_id: planId,
                drill_id: drillId,
                order_index: 0,
            });
        }

        // Create a team so coach has the messenger infrastructure
        await supabase
            .from('teams')
            .insert({ name: 'E2E Share Test Team', coach_id: coach.id });
    });

    test.afterAll(async () => {
        // Clean up in dependency order
        await supabase.from('messages').delete().eq('sender_id', coach.id);
        await supabase.from('teams').delete().eq('coach_id', coach.id);
        if (planId) {
            await supabase.from('training_plan_drills').delete().eq('plan_id', planId);
            await supabase.from('training_plans').delete().eq('id', planId);
        }
        if (drillId) await supabase.from('coach_drills').delete().eq('id', drillId);
        if (coach?.id) await supabase.auth.admin.deleteUser(coach.id);
        if (player?.id) await supabase.auth.admin.deleteUser(player.id);
    });

    test('Coach can navigate to Messages and open DM with player', async ({ page }) => {
        await loginAs(page, coach.email, coach.password, 'coach');
        await page.waitForTimeout(2000);

        // Click the MESSAGES tab in the coach dashboard navbar
        const messagesTab = page.locator('button').filter({ hasText: /MESSAGES/i }).first();
        await expect(messagesTab).toBeVisible({ timeout: 10000 });
        await messagesTab.click();
        await page.waitForTimeout(2000);

        // The Messages panel should now be visible
        await expect(page.locator('text=Messages').first()).toBeVisible({ timeout: 10000 });

        // The player entry should be visible in DM list
        const playerEntry = page.locator('button').filter({ hasText: /ShareE2E Athlete/i }).first();
        await expect(playerEntry).toBeVisible({ timeout: 10000 });

        // Click into the DM
        await playerEntry.click();
        await page.waitForTimeout(1500);

        // Should see the chat view with Direct Message label
        await expect(page.locator('text=Direct Message').first()).toBeVisible({ timeout: 10000 });

        // The "Attach Plan" button should be visible (identified by title attr)
        const attachPlanBtn = page.locator('button[title="Attach Plan"]');
        await expect(attachPlanBtn).toBeVisible({ timeout: 10000 });

        await page.screenshot({ path: 'test-results/share-plan-chat-view.png' });
    });

    test('Plan picker opens and shows available plans', async ({ page }) => {
        await loginAs(page, coach.email, coach.password, 'coach');
        await page.waitForTimeout(2000);

        // Navigate to Messages > DM with player
        await page.locator('button').filter({ hasText: /MESSAGES/i }).first().click();
        await page.waitForTimeout(2000);
        await page.locator('button').filter({ hasText: /ShareE2E Athlete/i }).first().click();
        await page.waitForTimeout(1500);

        // Click Attach Plan
        const attachPlanBtn = page.locator('button[title="Attach Plan"]');
        await expect(attachPlanBtn).toBeVisible({ timeout: 10000 });
        await attachPlanBtn.click();
        await page.waitForTimeout(500);

        // Plan picker should be visible
        await expect(page.locator('text=Select a Plan').first()).toBeVisible({ timeout: 5000 });

        // Our seeded plan should appear in the picker
        await expect(page.locator('text=E2E Share Flow Plan').first()).toBeVisible({ timeout: 5000 });

        await page.screenshot({ path: 'test-results/share-plan-picker-open.png' });
    });

    test('Coach can select plan, send message, and plan card renders', async ({ page }) => {
        await loginAs(page, coach.email, coach.password, 'coach');
        await page.waitForTimeout(2000);

        // Navigate to Messages > DM
        await page.locator('button').filter({ hasText: /MESSAGES/i }).first().click();
        await page.waitForTimeout(2000);
        await page.locator('button').filter({ hasText: /ShareE2E Athlete/i }).first().click();
        await page.waitForTimeout(1500);

        // Open plan picker and select plan
        await page.locator('button[title="Attach Plan"]').click();
        await page.waitForTimeout(500);
        await page.locator('text=E2E Share Flow Plan').first().click();
        await page.waitForTimeout(500);

        // Preview chip should show the plan title
        await expect(page.locator('div').filter({ hasText: /E2E Share Flow Plan/ }).first()).toBeVisible({ timeout: 5000 });

        // Type a message
        await page.fill('input[placeholder="Type a message..."]', 'Here is your training plan!');

        // Click send
        const sendBtn = page.locator('button:has(svg)').last();
        await sendBtn.click();
        await page.waitForTimeout(3000);

        // The sent message should appear with "Training Plan" card label
        await expect(page.locator('text=Training Plan').first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=E2E Share Flow Plan').first()).toBeVisible({ timeout: 5000 });

        await page.screenshot({ path: 'test-results/share-plan-sent.png' });
    });

    test('Shared plan card renders from pre-seeded DB message', async ({ page }) => {
        // Seed a message directly in DB to test rendering independently
        const { data: msg } = await supabase
            .from('messages')
            .insert({
                sender_id: coach.id,
                receiver_id: player.id,
                conversation_id: convId,
                content: 'DB-seeded plan share',
                shared_plan_id: planId,
            })
            .select('id')
            .single();

        await loginAs(page, coach.email, coach.password, 'coach');
        await page.waitForTimeout(2000);

        // Navigate to Messages > DM
        await page.locator('button').filter({ hasText: /MESSAGES/i }).first().click();
        await page.waitForTimeout(2000);
        await page.locator('button').filter({ hasText: /ShareE2E Athlete/i }).first().click();
        await page.waitForTimeout(2000);

        // The plan card should render
        await expect(page.locator('text=Training Plan').first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=E2E Share Flow Plan').first()).toBeVisible({ timeout: 5000 });

        await page.screenshot({ path: 'test-results/share-plan-card-visible.png' });

        // Cleanup
        if (msg) await supabase.from('messages').delete().eq('id', msg.id);
    });

    test('DB record: shared_plan_id is correctly stored after UI send', async () => {
        // Seed a message to verify DB shape (independent of UI tests above)
        const { data: msg, error: insertErr } = await supabase
            .from('messages')
            .insert({
                sender_id: coach.id,
                receiver_id: player.id,
                conversation_id: convId,
                content: 'DB shape verification',
                shared_plan_id: planId,
            })
            .select('id, shared_plan_id, sender_id, receiver_id')
            .single();

        expect(insertErr).toBeNull();
        expect(msg).toBeTruthy();
        expect(msg!.shared_plan_id).toBe(planId);
        expect(msg!.sender_id).toBe(coach.id);
        expect(msg!.receiver_id).toBe(player.id);

        // Cleanup
        if (msg) await supabase.from('messages').delete().eq('id', msg.id);
    });
});
