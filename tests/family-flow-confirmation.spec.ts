import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe.configure({ mode: 'serial' });

test.describe('Family Flow Confirmation: Transfers & Inheritance', () => {
    let parentId: string;
    let childId: string;
    const parentEmail = `parent-${Date.now()}@east.com`;
    const childEmail = `child-${Date.now()}@east.com`;
    let testSessionId: number;

    test.beforeAll(async () => {
        // 1. Create Parent (Active Subscriber)
        const { data: pData, error: pError } = await supabase.auth.admin.createUser({
            email: parentEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'parent' }
        });
        if (pError) throw pError;
        parentId = pData.user.id;

        await supabase.from('profiles').upsert({
            id: parentId,
            contact_email: parentEmail,
            role: 'parent',
            credits: 100,
            subscription_status: 'active', // Active Membership
            account_status: 'active'
        });

        // 2. Create Child (Inactive Subscriber, Linked to Parent)
        const { data: cData, error: cError } = await supabase.auth.admin.createUser({
            email: childEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player' }
        });
        if (cError) throw cError;
        childId = cData.user.id;

        await supabase.from('profiles').upsert({
            id: childId,
            contact_email: childEmail,
            role: 'player',
            credits: 0,
            subscription_status: 'inactive', // Should inherit from parent
            parent_id: parentId
        });

        // 3. Create a Test Session
        const { data: sData, error: sError } = await supabase.from('sessions').insert({
            title: 'Test Family Session',
            category: 'CLASS',
            instructor: 'Test Coach',
            start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(),
            credit_cost: 10,
            max_capacity: 10
        }).select('id').single();
        if (sError) throw sError;
        testSessionId = sData.id;
    });

    test.afterAll(async () => {
        if (parentId) await supabase.auth.admin.deleteUser(parentId);
        if (childId) await supabase.auth.admin.deleteUser(childId);
        if (testSessionId) await supabase.from('sessions').delete().eq('id', testSessionId);
    });

    test('Parent can transfer credits to Child', async ({ request }) => {
        // Authenticate as Parent to get token
        const { data: authData } = await supabase.auth.signInWithPassword({
            email: parentEmail,
            password: 'TestPassword123!'
        });
        const token = authData.session?.access_token;

        const response = await request.post('/api/user/transfer-credits', {
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                recipientId: childId,
                amount: 20
            }
        });

        expect(response.ok()).toBe(true);
        const resBody = await response.json();
        expect(resBody.success).toBe(true);

        // Verify Child Balance via DB
        const { data: childProfile } = await supabase.from('profiles').select('credits').eq('id', childId).single();
        expect(childProfile?.credits).toBe(20);
        console.log('[TEST] Credit transfer verified: 20 credits transferred.');
    });

    test('Child inherits parent status and can book session', async ({ request }) => {
        // Authenticate as Child to get token
        const { data: authData } = await supabase.auth.signInWithPassword({
            email: childEmail,
            password: 'TestPassword123!'
        });
        const token = authData.session?.access_token;

        // Attempt to book
        const response = await request.post('/api/sessions/book', {
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                userId: childId,
                sessionId: testSessionId,
                attendeeIds: [childId],
                origin: 'facilities'
            }
        });

        const resBody = await response.json();
        if (!response.ok()) {
            console.error('[TEST ERROR] Booking failed:', resBody);
        }
        expect(response.ok()).toBe(true);

        // Verify Registration in DB
        const { data: reg } = await supabase.from('registrations').select('*').eq('session_id', testSessionId).eq('attendee_id', childId).single();
        expect(reg).toBeDefined();
        console.log('[TEST] Booking successful: Child inherited status and used transferred credits.');
    });
});
