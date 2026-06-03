import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

test.describe('Session Capacity Management Integration', () => {
    let testServiceId: string;
    let testSessionId: number;
    let parentUserId: string;
    let childUserId: string;
    let parentToken: string;

    const testEmail = `capacity-test-${Date.now()}@test.com`;
    const testPassword = 'password123';
    const startTime = new Date(Date.now() + 86400000 * 3).toISOString(); // 3 days in future
    const endTime = new Date(Date.now() + 86400000 * 3 + 3600000).toISOString();

    test.beforeAll(async () => {
        // 1. Create Parent User
        const { data: parentData, error: parentError } = await supabaseAdmin.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: { role: 'parent' }
        });
        if (parentError || !parentData.user) throw parentError;
        parentUserId = parentData.user.id;

        // 2. Setup profiles for parent
        await supabaseAdmin.from('profiles').upsert({
            id: parentUserId,
            contact_email: testEmail,
            credits: 100,
            subscription_status: 'active',
            first_name: 'Parent',
            last_name: 'Tester'
        });

        // 3. Create child user and profile linked to parent
        const childEmail = `child-capacity-${Date.now()}@test.com`;
        const { data: childData, error: childAuthError } = await supabaseAdmin.auth.admin.createUser({
            email: childEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: { role: 'player' }
        });
        if (childAuthError || !childData.user) throw childAuthError;
        childUserId = childData.user.id;
        
        const { error: childError } = await supabaseAdmin.from('profiles').upsert({
            id: childUserId,
            contact_email: childEmail,
            parent_id: parentUserId,
            first_name: 'Child',
            last_name: 'Tester',
            role: 'player'
        });

        // 4. Authenticate parent to get token
        const { data: authData, error: authError } = await supabasePublic.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });
        if (authError || !authData.session) throw authError;
        parentToken = authData.session.access_token;

        // 5. Create session type (Class)
        const { data: service, error: svcError } = await supabaseAdmin
            .from('session_types')
            .insert({
                title: 'Capacity Test Class',
                category: 'CLASS',
                description: 'E2E Capacity Test Service',
                image_url: 'https://placehold.co/400'
            })
            .select()
            .single();
        if (svcError) throw svcError;
        testServiceId = service.id;

        // 6. Create session with max_capacity = 1 to test full capacity block
        const { data: session, error: sessError } = await supabaseAdmin
            .from('sessions')
            .insert({
                title: 'Capacity Test Class',
                description: 'E2E Capacity Test Session',
                start_time: startTime,
                end_time: endTime,
                category: 'CLASS',
                session_type_id: testServiceId,
                instructor: 'Coach Capacity',
                max_capacity: 1,
                credit_cost: 5,
                status: 'active'
            })
            .select()
            .single();
        if (sessError) throw sessError;
        testSessionId = session.id;
    });

    test.afterAll(async () => {
        // Cleanup
        if (testSessionId) {
            await supabaseAdmin.from('registrations').delete().eq('session_id', testSessionId);
            await supabaseAdmin.from('sessions').delete().eq('id', testSessionId);
        }
        if (testServiceId) await supabaseAdmin.from('session_types').delete().eq('id', testServiceId);
        if (childUserId) await supabaseAdmin.from('profiles').delete().eq('id', childUserId);
        if (parentUserId) await supabaseAdmin.auth.admin.deleteUser(parentUserId);
    });

    test('should manage capacity, fetch attendees list, and prevent overbooking', async ({ request }) => {
        // 1. Fetch initial session details & attendees via our route
        const fetchResponseInitial = await request.get(`/api/sessions?sessionId=${testSessionId}`, {
            headers: {
                'Authorization': `Bearer ${parentToken}`
            }
        });
        expect(fetchResponseInitial.ok()).toBeTruthy();
        const initialDetails = await fetchResponseInitial.json();
        expect(initialDetails.success).toBe(true);
        expect(initialDetails.attendees).toBeDefined();
        expect(initialDetails.attendees.length).toBe(0);

        // 2. Book first attendee (parent)
        const bookResponse1 = await request.post('/api/sessions/book', {
            headers: {
                'Authorization': `Bearer ${parentToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                sessionId: testSessionId,
                userId: parentUserId,
                origin: 'facilities'
            }
        });
        expect(bookResponse1.ok()).toBeTruthy();
        const bookJson1 = await bookResponse1.json();
        expect(bookJson1.success).toBe(true);

        // 3. Fetch attendees list - should now have 1 attendee
        const fetchResponseAfterBook = await request.get(`/api/sessions?sessionId=${testSessionId}`, {
            headers: {
                'Authorization': `Bearer ${parentToken}`
            }
        });
        expect(fetchResponseAfterBook.ok()).toBeTruthy();
        const afterBookDetails = await fetchResponseAfterBook.json();
        expect(afterBookDetails.success).toBe(true);
        expect(afterBookDetails.attendees.length).toBe(1);
        expect(afterBookDetails.attendees[0].user_id).toBe(parentUserId);

        // 4. Try to book second attendee (child) - should fail because max_capacity is 1
        const bookResponse2 = await request.post('/api/sessions/book', {
            headers: {
                'Authorization': `Bearer ${parentToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                sessionId: testSessionId,
                userId: childUserId,
                origin: 'facilities'
            }
        });
        // The booking route should return a failure/capacity error
        expect(bookResponse2.ok()).toBeFalsy();
        const bookJson2 = await bookResponse2.json();
        expect(bookJson2.error).toContain('capacity');

        // 5. Cancel the booking
        const cancelResponse = await request.delete('/api/sessions/cancel', {
            headers: {
                'Authorization': `Bearer ${parentToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                sessionId: testSessionId,
                userId: parentUserId
            }
        });
        expect(cancelResponse.ok()).toBeTruthy();
        const cancelJson = await cancelResponse.json();
        expect(cancelJson.success).toBe(true);

        // 6. Fetch attendees again - should be empty
        const fetchResponseFinal = await request.get(`/api/sessions?sessionId=${testSessionId}`, {
            headers: {
                'Authorization': `Bearer ${parentToken}`
            }
        });
        expect(fetchResponseFinal.ok()).toBeTruthy();
        const finalDetails = await fetchResponseFinal.json();
        expect(finalDetails.attendees.length).toBe(0);
    });
});
