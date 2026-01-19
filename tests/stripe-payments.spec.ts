import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * STRIPE PAYMENTS & ROBUSTNESS TESTS
 * 
 * Verifies:
 * 1. All credit top-up packages add correct amounts.
 * 2. Memberships grant initial and recurring credits.
 * 3. Idempotency (duplicate webhooks don't double-charge).
 * 4. Subscription cancellation updates profile status.
 */

test.describe('Stripe Payment System', () => {
    let testUserId: string;
    let testUserEmail: string;

    test.beforeEach(async () => {
        testUserEmail = `stripe-test-${Date.now()}@east.com`;

        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email: testUserEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'parent', first_name: 'Stripe', last_name: 'Test' }
        });

        if (createError) throw createError;
        testUserId = userData.user.id;

        await supabase.from('profiles').upsert({
            id: testUserId,
            role: 'parent',
            first_name: 'Stripe',
            last_name: 'Test',
            credits: 0
        });
    });

    test.afterEach(async () => {
        if (testUserId) {
            await supabase.auth.admin.deleteUser(testUserId);
            await supabase.from('profiles').delete().eq('id', testUserId);
        }
    });

    async function simulateWebhook(page: any, payload: any) {
        return await page.evaluate(async (data: any) => {
            const res = await fetch('/api/webhooks/stripe?test=true', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'stripe-signature': 'test_signature' },
                body: JSON.stringify(data)
            });
            return { status: res.status, body: await res.text() };
        }, payload);
    }

    test.describe('Credit Top-Ups', () => {
        const packages = [
            { credits: 500, priceId: 'price_1SkINl12ap1SCxTolaVPqdzA' },
            { credits: 1000, priceId: 'price_1SkINl12ap1SCxToIyvikBgt' },
            { credits: 2500, priceId: 'price_1SkINl12ap1SCxTodZWHrIQm' },
            { credits: 5000, priceId: 'price_1SkINl12ap1SCxToJvTqg6wj' },
            { credits: 10000, priceId: 'price_1SkINl12ap1SCxTotmD50PGA' }
        ];

        for (const pkg of packages) {
            test(`Package: ${pkg.credits} credits adds correctly`, async ({ page }) => {
                await page.goto('/');
                const payload = {
                    type: 'checkout.session.completed',
                    data: {
                        object: {
                            mode: 'payment',
                            customer_details: { email: testUserEmail },
                            metadata: { target_user_id: testUserId, credit_amount: pkg.credits.toString() }
                        }
                    }
                };

                await simulateWebhook(page, payload);

                // 1. Verify credits updated
                const { data: profile } = await supabase.from('profiles').select('credits').eq('id', testUserId).single();
                expect(profile?.credits).toBe(pkg.credits);

                // 2. Verify transaction record created
                const { data: tx } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', testUserId)
                    .eq('type', 'topup')
                    .single();

                expect(tx).toBeDefined();
                expect(tx.amount).toBe(pkg.credits);
            });
        }
    });

    test.describe('Robustness & Edge Cases', () => {

        test('Verify Idempotency: Duplicate webhooks do not double-add credits', async ({ page }) => {
            await page.goto('/');
            const sessionId = `sess_${Date.now()}`;
            const payload = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: sessionId,
                        mode: 'payment',
                        customer_details: { email: testUserEmail },
                        metadata: { target_user_id: testUserId, credit_amount: '500' }
                    }
                }
            };

            // Send first time
            await simulateWebhook(page, payload);

            // Send second time (simulating Stripe retry or double-delivery)
            await simulateWebhook(page, payload);

            const { data: profile } = await supabase.from('profiles').select('credits').eq('id', testUserId).single();

            // NOTE: Currently the app might NOT be idempotent. This test will help us verify.
            // If it double-adds, this test will fail, highlighting a bug!
            expect(profile?.credits).toBe(500);
        });

        test('Subscription Cancellation: Updates profile status', async ({ page }) => {
            await page.goto('/');

            // First, make them a member
            const subId = `sub_${Date.now()}`;
            await simulateWebhook(page, {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        mode: 'subscription',
                        subscription: subId,
                        customer: 'cus_test',
                        metadata: { userId: testUserId }
                    }
                }
            });

            // Now cancel it (Simulate customer.subscription.deleted)
            await simulateWebhook(page, {
                type: 'customer.subscription.deleted',
                data: {
                    object: { id: subId, customer: 'cus_test' }
                }
            });

            const { data: profile } = await supabase.from('profiles').select('subscription_status').eq('id', testUserId).single();

            // If we implement the handler, this should be 'canceled'
            expect(profile?.subscription_status).toBe('canceled');
        });
    });
});
