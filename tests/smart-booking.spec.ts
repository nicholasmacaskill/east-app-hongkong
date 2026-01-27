
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

test.describe('Smart Booking Exclusivity', () => {
    let sessionAId: number;
    let sessionBId: number;
    let userId: string;
    let userToken: string;

    const testInstructor = 'Test Instructor ' + Date.now();
    // Use a time far in the future to avoid interfering with real schedule
    const startTime = new Date(Date.now() + 86400000 * 5).toISOString(); // +5 days
    const endTime = new Date(Date.now() + 86400000 * 5 + 3600000).toISOString(); // +1 hour
    const testEmail = `smart-book-test-${Date.now()}@test.com`;
    const testPassword = 'password123';

    test.beforeAll(async () => {
        // 1. Create User
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: { role: 'player' }
        });
        if (userError || !userData.user) throw userError;
        userId = userData.user.id;

        // 2. Grant Credits
        const upsertRes = await supabaseAdmin.from('profiles').upsert({
            id: userId,
            contact_email: testEmail, // Ensure profile exists
            credits: 500,
            subscription_status: 'active',
            first_name: 'Smart',
            last_name: 'Tester'
        }).select();

        if (upsertRes.error) {
            console.error('Upsert Error:', upsertRes.error);
            throw upsertRes.error;
        }

        // Verify Profile Exists
        const { data: profileCheck } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
        console.log('Test Profile:', profileCheck);
        if (!profileCheck) throw new Error('Profile creation failed in setup');

        // 3. Login to get Token
        const { data: authData, error: authError } = await supabasePublic.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        if (authError || !authData.session) throw authError;
        userToken = authData.session.access_token;

        // 4. Create Conflicting Sessions
        const sA = await supabaseAdmin.from('sessions').insert({
            title: 'Session A',
            instructor: testInstructor,
            start_time: startTime,
            end_time: endTime,
            max_capacity: 1,
            credit_cost: 10,
            status: 'active'
        }).select().single();
        if (sA.error) throw sA.error;
        sessionAId = sA.data.id;

        const sB = await supabaseAdmin.from('sessions').insert({
            title: 'Session B',
            instructor: testInstructor,
            start_time: startTime,
            end_time: endTime,
            max_capacity: 1,
            credit_cost: 10,
            status: 'active'
        }).select().single();
        if (sB.error) throw sB.error;
        sessionBId = sB.data.id;
    });

    test.afterAll(async () => {
        if (sessionAId) await supabaseAdmin.from('sessions').delete().eq('id', sessionAId);
        if (sessionBId) await supabaseAdmin.from('sessions').delete().eq('id', sessionBId);
        if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
    });

    test('Booking A voids B, Cancelling A restores B', async ({ request }) => {
        // Step 1: Verify both active
        const resInitial = await supabaseAdmin.from('sessions').select('id, status').in('id', [sessionAId, sessionBId]);
        const activeInitial = resInitial.data?.filter(s => s.status === 'active');
        expect(activeInitial?.length).toBe(2);

        // Step 2: Book Session A
        const bookResponse = await request.post('/api/sessions/book', {
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                sessionId: sessionAId,
                userId: userId,
                origin: 'coaches'
            }
        });

        if (!bookResponse.ok()) {
            console.log('Book Response Status:', bookResponse.status());
            console.log('Book Response Body:', await bookResponse.text());
        }
        expect(bookResponse.ok()).toBeTruthy();
        const bookJson = await bookResponse.json();
        expect(bookJson.success).toBe(true);

        // Step 3: Verify B is VOIDED
        const { data: sB_AfterBook } = await supabaseAdmin.from('sessions').select('status').eq('id', sessionBId).single();
        expect(sB_AfterBook?.status).toBe('voided');

        // Step 4: Cancel Session A
        const cancelResponse = await request.delete('/api/sessions/cancel', {
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                sessionId: sessionAId,
                userId: userId
            }
        });
        expect(cancelResponse.ok()).toBeTruthy();
        const cancelJson = await cancelResponse.json();
        expect(cancelJson.success).toBe(true);

        // Step 5: Verify B is RESTORED
        const { data: sB_AfterCancel } = await supabaseAdmin.from('sessions').select('status').eq('id', sessionBId).single();
        expect(sB_AfterCancel?.status).toBe('active');
    });
});
