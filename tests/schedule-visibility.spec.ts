import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('Schedule Visibility & Isolation', () => {
    let coachA: { id: string; name: string };
    let coachB: { id: string; name: string }; // The "confusing" coach
    let slotsToDelete: string[] = [];

    test.beforeAll(async () => {
        // 1. Create Coach "Ben" (A)
        const emailA = `test-coach-ben-${Date.now()}@east.com`;
        const { data: authA } = await supabase.auth.admin.createUser({
            email: emailA, password: 'password123', email_confirm: true,
            user_metadata: { first_name: 'Ben', last_name: 'Test', role: 'coach' }
        });
        if (!authA.user) throw new Error("Failed to create Coach A");
        coachA = { id: authA.user.id, name: 'Ben Test' };
        await supabase.from('profiles').upsert({ id: coachA.id, role: 'coach', first_name: 'Ben', last_name: 'Test' });

        // 2. Create Coach "Benny" (B) - Similar name to test strictness
        const emailB = `test-coach-benny-${Date.now()}@east.com`;
        const { data: authB } = await supabase.auth.admin.createUser({
            email: emailB, password: 'password123', email_confirm: true,
            user_metadata: { first_name: 'Benny', last_name: 'Test', role: 'coach' }
        });
        if (!authB.user) throw new Error("Failed to create Coach B");
        coachB = { id: authB.user.id, name: 'Benny Test' };
        await supabase.from('profiles').upsert({ id: coachB.id, role: 'coach', first_name: 'Benny', last_name: 'Test' });
    });

    test.afterAll(async () => {
        if (slotsToDelete.length > 0) await supabase.from('availability').delete().in('id', slotsToDelete);
        if (coachA) {
            await supabase.from('profiles').delete().eq('id', coachA.id);
            await supabase.auth.admin.deleteUser(coachA.id);
        }
        if (coachB) {
            await supabase.from('profiles').delete().eq('id', coachB.id);
            await supabase.auth.admin.deleteUser(coachB.id);
        }
    });

    test('Admin Schedule respects strict ID filtering', async ({ page }) => {
        // 1. Manually insert a slot for Coach A (Ben) via DB to ensure state
        const start = new Date();
        start.setHours(10, 0, 0, 0);
        const end = new Date(start);
        end.setHours(11, 0, 0, 0);

        const { data: slot, error } = await supabase.from('availability').insert({
            coach_id: coachA.id,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            status: 'available'
        }).select().single();
        if (error) throw error;
        slotsToDelete.push(slot.id);

        console.log(`[TEST] Created slot ${slot.id} for ${coachA.name} (${coachA.id})`);

        // 2. Go to Admin Schedule
        await page.goto('/sys-admin/schedule');

        // 3. Filter by Coach A (Ben) -> Should see slot
        await page.selectOption('select', coachA.id);
        await page.waitForTimeout(1000); // Allow fetch
        const countA = await page.getByText('Open Slot').count();
        expect(countA).toBeGreaterThan(0);
        console.log(`[TEST] Filtered by Ben: Found ${countA} slots (Expected > 0)`);

        // 4. Filter by Coach B (Benny) -> Should see ZERO slots (Strict Check)
        await page.selectOption('select', coachB.id);
        await page.waitForTimeout(1000);
        const countB = await page.getByText('Open Slot').count();
        console.log(`[TEST] Filtered by Benny: Found ${countB} slots`);

        // This is the critical architectural fix verification
        expect(countB).toBe(0);

        // 5. Filter by "All" -> Should see slot again
        await page.selectOption('select', 'ALL');
        await page.waitForTimeout(500);
        const countAll = await page.getByText('Open Slot').count();
        expect(countAll).toBeGreaterThan(0);
    });
});
