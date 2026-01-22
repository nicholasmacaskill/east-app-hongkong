import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Booking Atomicity (Bug #11)', () => {
    let testUser: any;
    let testSession: any;
    let testCoach: any;

    test.beforeAll(async () => {
        // 1. Create Test User
        const email = `atomic-tester-${Date.now()}@test.com`;
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: 'Password123!',
            email_confirm: true
        });
        if (authError) throw authError;
        testUser = authUser.user;

        // Ensure profile exists
        await supabase.from('profiles').upsert({
            id: testUser.id,
            email: email,
            role: 'player',
            credits: 1000, // Enough for facility, not for coach
            subscription_status: 'active',
            account_status: 'active'
        });

        // 2. Create Test Session (Facility)
        const { data: session, error: sessError } = await supabase.from('sessions').insert({
            title: 'Atomic Test Session',
            category: 'GROUP',
            start_time: new Date(Date.now() + 86400000).toISOString(),
            end_time: new Date(Date.now() + 90000000).toISOString(),
            credit_cost: 600,
            max_capacity: 10
        }).select().single();
        if (sessError) throw sessError;
        testSession = session;

        // 3. Create Test Coach
        const coachEmail = `atomic-coach-${Date.now()}@test.com`;
        const { data: authCoach } = await supabase.auth.admin.createUser({
            email: coachEmail,
            password: 'Password123!',
            email_confirm: true
        });
        testCoach = authCoach.user;
        await supabase.from('profiles').upsert({
            id: testCoach.id,
            email: coachEmail,
            role: 'coach',
            first_name: 'Atomic',
            last_name: 'Coach'
        });

        // Add availability
        await supabase.from('availability').insert({
            coach_id: testCoach.id,
            start_time: new Date(Date.now() - 3600000).toISOString(),
            end_time: new Date(Date.now() + 186400000).toISOString()
        });
    });

    test.afterAll(async () => {
        if (testUser) await supabase.auth.admin.deleteUser(testUser.id);
        if (testCoach) await supabase.auth.admin.deleteUser(testCoach.id);
        if (testSession) await supabase.from('sessions').delete().eq('id', testSession.id);
    });

    test('Should rollback facility booking if coach booking fails (Insufficient Credits)', async ({ request }) => {
        // Sign in to get token
        const { data: auth } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: 'Password123!'
        });
        const token = auth.session?.access_token;

        const response = await request.post('/api/sessions/book', {
            data: {
                sessionId: testSession.id,
                userId: testUser.id,
                coachId: testCoach.id,
                coachTier: 'senior',
                origin: 'facilities'
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const body = await response.json();
        expect(response.status()).toBe(400);
        expect(body.code).toBe('INSUFFICIENT_CREDITS');

        // Verify NO credits were deducted
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', testUser.id).single();
        expect(profile?.credits).toBe(1000);

        // Verify NO registrations exist
        const { data: registrations } = await supabase.from('registrations')
            .select('*')
            .eq('user_id', testUser.id)
            .eq('session_id', testSession.id);
        expect(registrations?.length).toBe(0);
    });

    test('Should succeed atomically when credits are sufficient', async ({ request }) => {
        // Sign in to get token
        const { data: auth } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: 'Password123!'
        });
        const token = auth.session?.access_token;

        // Give enough credits
        await supabase.from('profiles').update({ credits: 2000 }).eq('id', testUser.id);

        const response = await request.post('/api/sessions/book', {
            data: {
                sessionId: testSession.id,
                userId: testUser.id,
                coachId: testCoach.id,
                coachTier: 'junior', // 500
                origin: 'facilities'
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        expect(response.status()).toBe(200);

        // Verify credits: 2000 - 600 (facility) - 500 (coach) = 900
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', testUser.id).single();
        expect(profile?.credits).toBe(900);

        // Verify registrations exist for both
        const { data: regs } = await supabase.from('registrations').select('*').eq('user_id', testUser.id);
        expect(regs?.length).toBe(2); // One main, one private
    });
});
