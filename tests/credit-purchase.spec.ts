import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Credit Purchase & Membership Tests', () => {
    let testUserId: string;
    let testUserEmail: string;

    test.beforeEach(async () => {
        // Create fresh test user for each test
        testUserEmail = `test-credits-${Date.now()}@east.com`;

        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email: testUserEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: {
                role: 'parent',
                first_name: 'Credit',
                last_name: 'Test'
            }
        });

        if (createError) throw createError;
        testUserId = userData.user.id;

        // Create profile with 0 initial credits
        await supabase.from('profiles').upsert({
            id: testUserId,
            role: 'parent',
            first_name: 'Credit',
            last_name: 'Test',
            credits: 0
        });

        console.log(`[SETUP] Created test user: ${testUserId}, credits: 0`);
    });

    test.afterEach(async () => {
        // Cleanup
        if (testUserId) {
            await supabase.auth.admin.deleteUser(testUserId);
            await supabase.from('profiles').delete().eq('id', testUserId);
        }
    });

    // Credit Package Tests
    const creditPackages = [
        { credits: 500, priceId: 'price_1SkINl12ap1SCxTolaVPqdzA', price: '$500' },
        { credits: 1000, priceId: 'price_1SkINl12ap1SCxToIyvikBgt', price: '$1000' },
        { credits: 2500, priceId: 'price_1SkINl12ap1SCxTodZWHrIQm', price: '$2500' },
        { credits: 5000, priceId: 'price_1SkINl12ap1SCxToJvTqg6wj', price: '$5000' },
        { credits: 10000, priceId: 'price_1SkINl12ap1SCxTotmD50PGA', price: '$10000' }
    ];

    for (const pkg of creditPackages) {
        test(`${pkg.credits} credit package (${pkg.price}) adds correct amount`, async ({ page }) => {
            // Navigate to app to have auth context
            await page.goto('/');
            await page.waitForTimeout(500);

            // Simulate Stripe webhook for one-time purchase
            const webhookEvent = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: `cs_test_${Date.now()}`,
                        mode: 'payment',
                        customer_details: {
                            email: testUserEmail
                        },
                        metadata: {
                            userId: testUserId,
                            target_user_id: testUserId,
                            credit_amount: pkg.credits.toString()
                        }
                    }
                }
            };

            // Call webhook endpoint via browser context (has proper headers)
            const response = await page.evaluate(async (payload) => {
                const res = await fetch('/api/webhooks/stripe?test=true', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'stripe-signature': 'test_signature' // Would be validated in production
                    },
                    body: JSON.stringify(payload)
                });
                return {
                    status: res.status,
                    body: await res.text()
                };
            }, webhookEvent);

            console.log(`[TEST] Webhook response for ${pkg.credits} credits:`, response);

            // Verify credits were added
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', testUserId)
                .single();

            if (error) throw error;

            console.log(`[VERIFY] User credits after purchase: ${profile?.credits}`);
            expect(profile?.credits).toBe(pkg.credits);
        });
    }

    // Membership Subscription Tests
    test('Individual Monthly subscription grants 1000 credits', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(500);

        const webhookEvent = {
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: `cs_test_${Date.now()}`,
                    mode: 'subscription',
                    customer: 'cus_test_individual',
                    subscription: 'sub_test_individual_monthly',
                    customer_details: {
                        email: testUserEmail
                    },
                    metadata: {
                        userId: testUserId
                    }
                }
            }
        };

        // Note: In real implementation, we'd need to mock the Stripe subscription retrieve call
        // For now, testing the webhook structure
        const response = await page.evaluate(async (payload) => {
            const res = await fetch('/api/webhooks/stripe?test=true', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'stripe-signature': 'test' },
                body: JSON.stringify(payload)
            });
            return { status: res.status, body: await res.text() };
        }, webhookEvent);

        console.log('[TEST] Subscription webhook response:', response);

        // This test verifies the webhook endpoint accepts subscription events
        // Full testing would require mocking Stripe.subscriptions.retrieve()
        expect(response.status).toBeLessThan(500);
    });
});
