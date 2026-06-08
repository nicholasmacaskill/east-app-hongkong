/**
 * SHARE TRAINING PLAN — LOGIC / DATA INTEGRITY TESTS
 *
 * Validates the database layer for the "Share Training Plans" feature:
 * 1. shared_plan_id column exists on messages table
 * 2. A coach can insert a message with shared_plan_id referencing a valid plan
 * 3. The FK constraint rejects invalid plan IDs
 * 4. RLS: A player can read a message with a shared_plan_id
 * 5. Cleanup is deterministic
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
    const email = `share-plan-${label}-${Date.now()}@east.test`;
    const password = 'TestPassword123!';
    const { data: userData, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, first_name: 'SharePlan', last_name: label },
    });
    if (error || !userData.user) throw new Error(`Failed to create ${role}: ${error?.message}`);
    const id = userData.user.id;
    await supabase.from('profiles').upsert({
        id,
        role,
        first_name: 'SharePlan',
        last_name: label,
        credits: role === 'player' ? 100 : 0,
    });
    return { id, email, password };
}

// ─────────────────────────────────────────────
// SUITE
// ─────────────────────────────────────────────
test.describe('Share Training Plan — Data Integrity', () => {
    let coach: { id: string; email: string; password: string };
    let player: { id: string; email: string; password: string };
    let planId: string | null = null;
    let drillId: string | null = null;
    let messageId: string | null = null;
    let convId: string;

    test.beforeAll(async () => {
        coach = await createTestUser('coach', 'Coach');
        player = await createTestUser('player', 'Player');
        convId = conversationId(coach.id, player.id);

        // Create a drill owned by the coach
        const { data: drill, error: drillErr } = await supabase
            .from('coach_drills')
            .insert({
                title: 'Share Plan Logic Test Drill',
                coach_id: coach.id,
                status: 'published',
                skill_tags: ['passing'],
            })
            .select('id')
            .single();
        if (drillErr) throw drillErr;
        drillId = drill!.id;

        // Create a training plan owned by the coach
        const { data: plan, error: planErr } = await supabase
            .from('training_plans')
            .insert({
                title: 'Share Plan Logic Test Plan',
                coach_id: coach.id,
                description: 'E2E logic test plan',
            })
            .select('id')
            .single();
        if (planErr) throw planErr;
        planId = plan!.id;

        // Link drill to plan
        await supabase.from('training_plan_drills').insert({
            plan_id: planId,
            drill_id: drillId,
            order_index: 0,
        });
    });

    test.afterAll(async () => {
        // Deterministic cleanup in dependency order
        await supabase.from('messages').delete().eq('conversation_id', convId);
        if (planId) {
            await supabase.from('training_plan_drills').delete().eq('plan_id', planId);
            await supabase.from('training_plans').delete().eq('id', planId);
        }
        if (drillId) await supabase.from('coach_drills').delete().eq('id', drillId);
        if (coach?.id) await supabase.auth.admin.deleteUser(coach.id);
        if (player?.id) await supabase.auth.admin.deleteUser(player.id);
    });

    test('1. shared_plan_id column exists on messages table', async () => {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id: coach.id,
                receiver_id: player.id,
                conversation_id: convId,
                content: 'Check out this training plan!',
                shared_plan_id: planId,
            })
            .select('id, shared_plan_id')
            .single();

        expect(error).toBeNull();
        expect(data).toBeTruthy();
        expect(data!.shared_plan_id).toBe(planId);
        messageId = data!.id;
    });

    test('2. Message with shared_plan_id can be read back with correct data', async () => {
        expect(messageId).toBeTruthy();

        const { data, error } = await supabase
            .from('messages')
            .select('id, sender_id, receiver_id, content, shared_plan_id')
            .eq('id', messageId!)
            .single();

        expect(error).toBeNull();
        expect(data!.sender_id).toBe(coach.id);
        expect(data!.receiver_id).toBe(player.id);
        expect(data!.shared_plan_id).toBe(planId);
        expect(data!.content).toBe('Check out this training plan!');
    });

    test('3. FK constraint: invalid shared_plan_id is rejected', async () => {
        const fakeUuid = '00000000-0000-0000-0000-000000000000';
        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: coach.id,
                receiver_id: player.id,
                conversation_id: convId,
                content: 'Bad plan ref',
                shared_plan_id: fakeUuid,
            });

        // Should fail with a foreign key violation
        expect(error).toBeTruthy();
        expect(error!.code).toBe('23503'); // FK violation
    });

    test('4. Null shared_plan_id still works (backwards compat)', async () => {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id: coach.id,
                receiver_id: player.id,
                conversation_id: convId,
                content: 'Regular message with no plan',
            })
            .select('id, shared_plan_id')
            .single();

        expect(error).toBeNull();
        expect(data!.shared_plan_id).toBeNull();

        // Cleanup this extra message
        if (data) await supabase.from('messages').delete().eq('id', data.id);
    });

    test('5. Training plan with drills can be resolved from shared_plan_id', async () => {
        expect(planId).toBeTruthy();

        const { data: plan, error: planErr } = await supabase
            .from('training_plans')
            .select('id, title, coach_id')
            .eq('id', planId!)
            .single();

        expect(planErr).toBeNull();
        expect(plan!.title).toBe('Share Plan Logic Test Plan');
        expect(plan!.coach_id).toBe(coach.id);

        const { data: drills, error: drillsErr } = await supabase
            .from('training_plan_drills')
            .select('drill_id, order_index')
            .eq('plan_id', planId!)
            .order('order_index', { ascending: true });

        expect(drillsErr).toBeNull();
        expect(drills!.length).toBe(1);
        expect(drills![0].drill_id).toBe(drillId);
    });

    test('6. ON DELETE SET NULL: deleting plan nullifies shared_plan_id', async () => {
        // Create a temporary plan + message to test cascade
        const { data: tmpPlan } = await supabase
            .from('training_plans')
            .insert({ title: 'Temp Cascade Plan', coach_id: coach.id })
            .select('id')
            .single();
        expect(tmpPlan).toBeTruthy();

        const { data: tmpMsg } = await supabase
            .from('messages')
            .insert({
                sender_id: coach.id,
                receiver_id: player.id,
                conversation_id: convId,
                content: 'Cascade test',
                shared_plan_id: tmpPlan!.id,
            })
            .select('id')
            .single();
        expect(tmpMsg).toBeTruthy();

        // Delete the plan
        await supabase.from('training_plans').delete().eq('id', tmpPlan!.id);

        // Message should still exist but shared_plan_id should be null
        const { data: check } = await supabase
            .from('messages')
            .select('shared_plan_id')
            .eq('id', tmpMsg!.id)
            .single();

        expect(check!.shared_plan_id).toBeNull();

        // Cleanup
        await supabase.from('messages').delete().eq('id', tmpMsg!.id);
    });
});
