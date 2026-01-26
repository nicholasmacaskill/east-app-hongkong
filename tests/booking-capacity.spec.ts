import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Session Capacity Enforcement', () => {
    let testUserId: string;
    let testSessionId: number;
    const uniqueSuffix = Date.now();
    const testEmail = `capacity-test-${uniqueSuffix}@east.com`;

    test.beforeAll(async () => {
        // Create test user with credits
        const { data, error } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'Capacity', last_name: 'Test' }
        });

        if (error) throw error;
        testUserId = data.user.id;

        await supabase.from('profiles').upsert({
            id: testUserId,
            role: 'player',
            first_name: 'Capacity',
            last_name: 'Test',
            credits: 1000,
            contact_email: testEmail
        });

        // Create a test session with capacity of 2
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert({
                title: `Capacity Test Session ${uniqueSuffix}`,
                start_time: tomorrow.toISOString(),
                end_time: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
                credit_cost: 10,
                instructor: 'Test Coach',
                category: 'CLASS',
                max_capacity: 2  // Set capacity to 2 for testing
            })
            .select()
            .single();

        if (sessionError) throw sessionError;
        testSessionId = session.id;
    });

    test.afterAll(async () => {
        // Cleanup
        if (testSessionId) {
            await supabase.from('registrations').delete().eq('session_id', testSessionId);
            await supabase.from('sessions').delete().eq('id', testSessionId);
        }
        if (testUserId) {
            await supabase.auth.admin.deleteUser(testUserId);
        }
    });

    test('Booking succeeds when capacity is available', async () => {
        // Book the first spot
        const { data, error } = await supabase.rpc('book_session_with_credits', {
            p_user_id: testUserId,
            p_session_id: testSessionId
        });

        expect(error).toBeNull();
        expect(data.success).toBe(true);
        expect(data.message).toContain('Booking confirmed');

        console.log('✅ First booking succeeded');
    });

    test('Booking fails when session is full', async () => {
        // Create a second user
        const user2Email = `capacity-test-2-${uniqueSuffix}@east.com`;
        const { data: user2 } = await supabase.auth.admin.createUser({
            email: user2Email,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player' }
        });

        await supabase.from('profiles').upsert({
            id: user2.user.id,
            role: 'player',
            credits: 1000
        });

        // Book the second spot
        const booking2 = await supabase.rpc('book_session_with_credits', {
            p_user_id: user2.user.id,
            p_session_id: testSessionId
        });

        expect(booking2.data.success).toBe(true);
        console.log('✅ Second booking succeeded');

        // Create a third user
        const user3Email = `capacity-test-3-${uniqueSuffix}@east.com`;
        const { data: user3 } = await supabase.auth.admin.createUser({
            email: user3Email,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player' }
        });

        await supabase.from('profiles').upsert({
            id: user3.user.id,
            role: 'player',
            credits: 1000
        });

        // Try to book the third spot (should fail - session full)
        const booking3 = await supabase.rpc('book_session_with_credits', {
            p_user_id: user3.user.id,
            p_session_id: testSessionId
        });

        expect(booking3.data.success).toBe(false);
        expect(booking3.data.message).toContain('full');
        expect(booking3.data.current_bookings).toBe(2);
        expect(booking3.data.max_capacity).toBe(2);

        console.log('✅ Third booking correctly rejected - session full');
        console.log(`   Message: ${booking3.data.message}`);

        // Cleanup extra users
        await supabase.auth.admin.deleteUser(user2.user.id);
        await supabase.auth.admin.deleteUser(user3.user.id);
    });

    test('Capacity check prevents double booking same user', async () => {
        // Try to book again with the same user (already registered)
        const { data } = await supabase.rpc('book_session_with_credits', {
            p_user_id: testUserId,
            p_session_id: testSessionId
        });

        expect(data.success).toBe(false);
        expect(data.message).toContain('already registered');

        console.log('✅ Duplicate booking correctly prevented');
    });
});
