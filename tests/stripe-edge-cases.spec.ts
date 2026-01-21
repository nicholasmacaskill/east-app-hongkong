import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Stripe Webhook Edge Cases', () => {
    let testUserEmail: string;
    let testUserId: string;
    let stripeCustomerId: string;

    test.beforeEach(async () => {
        // 1. Create a Test User
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        testUserEmail = `stripe-test-${timestamp}-${random}@east.com`;
        stripeCustomerId = `cus_test_${timestamp}`;

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: testUserEmail,
            password: 'StripeTestUser123!',
            email_confirm: true,
            user_metadata: { first_name: 'Stripe', last_name: 'Tester' }
        });

        if (authError) throw authError;
        testUserId = authUser.user.id;

        // 2. Create Profile with "Active" Subscription initially
        await supabase.from('profiles').upsert({
            id: testUserId,
            first_name: 'Stripe',
            last_name: 'Tester',
            contact_email: testUserEmail,
            role: 'player',
            credits: 100,
            stripe_customer_id: stripeCustomerId,
            subscription_status: 'active', // Initially active
            account_status: 'standard' // explicit non-override status
        });
    });

    test.afterEach(async () => {
        if (testUserId) {
            await supabase.auth.admin.deleteUser(testUserId);
            await supabase.from('profiles').delete().eq('id', testUserId);
        }
    });

    test('Webhook: customer.subscription.updated -> past_due should LOCK user', async ({ request }) => {
        // 1. Verify user is initially UNLOCKED (Active)
        let { data: profile } = await supabase.from('profiles').select('subscription_status').eq('id', testUserId).single();
        expect(profile?.subscription_status).toBe('active');

        // 2. Simulate Webhook: subscription updated to 'past_due'
        const payload = {
            id: 'evt_test_webhook_1',
            object: 'event',
            type: 'customer.subscription.updated',
            data: {
                object: {
                    id: 'sub_test_123',
                    customer: stripeCustomerId,
                    status: 'past_due',
                    current_period_end: Math.floor(Date.now() / 1000) + 86400 // +1 day
                }
            }
        };

        const response = await request.post('/api/webhooks/stripe?test=true', {
            data: payload
        });
        expect(response.status()).toBe(200);

        // 3. Verify Profile Update in DB
        // Fetch fresh data
        ({ data: profile } = await supabase.from('profiles').select('subscription_status').eq('id', testUserId).single());

        // The handler should have updated the status to 'past_due'
        expect(profile?.subscription_status).toBe('past_due');

        // This effectively "Locks" the user in the UI logic handled by AppHeader.tsx
    });

    test('Webhook: checkout.session.completed (Top-Up) should work even if LOCKED', async ({ request }) => {
        // 1. Manually LOCK the user first
        await supabase.from('profiles').update({ subscription_status: 'past_due' }).eq('id', testUserId);

        // 2. Simulate Top-Up Webhook
        const topUpAmount = 500;
        const payload = {
            id: 'evt_test_webhook_2',
            object: 'event',
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: 'cs_test_topup_123',
                    mode: 'payment',
                    customer_details: { email: testUserEmail },
                    metadata: {
                        target_user_id: testUserId,
                        credit_amount: topUpAmount.toString()
                    }
                }
            }
        };

        const response = await request.post('/api/webhooks/stripe?test=true', {
            data: payload
        });
        expect(response.status()).toBe(200);

        // 3. Verify Credits Increased
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', testUserId).single();
        // Initial 100 + 500 = 600
        expect(profile?.credits).toBe(600);
    });
});
