import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Membership Tier Verification', () => {
    let testUserId: string;
    let testUserEmail: string;

    const plans = [
        { name: 'Individual Monthly', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY, expectedCredits: 1000, expectedTier: 'individual' },
        { name: 'Family 2 Monthly', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY, expectedCredits: 2500, expectedTier: 'family_2' },
        { name: 'Family 3+ Monthly', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY, expectedCredits: 3500, expectedTier: 'family_3plus' },
        { name: 'Individual Yearly', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY, expectedCredits: 15000, expectedTier: 'individual' },
        { name: 'Family 2 Yearly', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY, expectedCredits: 33000, expectedTier: 'family_2' },
        { name: 'Family 3+ Yearly', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY, expectedCredits: 45000, expectedTier: 'family_3plus' },
    ].filter(p => p.priceId);

    test.beforeEach(async () => {
        testUserEmail = `tier-test-${Date.now()}@east.com`;
        const { data: userData } = await supabase.auth.admin.createUser({
            email: testUserEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'parent' }
        });
        testUserId = userData.user!.id;
        await supabase.from('profiles').upsert({ id: testUserId, role: 'parent', credits: 0 });
    });

    test.afterEach(async () => {
        if (testUserId) {
            await supabase.auth.admin.deleteUser(testUserId);
            await supabase.from('profiles').delete().eq('id', testUserId);
        }
    });

    for (const plan of plans) {
        test(`Verify ${plan.name} grants ${plan.expectedCredits} credits and sets tier to ${plan.expectedTier}`, async ({ page }) => {
            const payload = {
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: `sess_test_${Date.now()}`,
                        mode: 'subscription',
                        subscription: 'sub_test',
                        customer: 'cus_test',
                        customer_details: { email: testUserEmail },
                        metadata: {
                            userId: testUserId,
                            test_price_id: plan.priceId
                        }
                    }
                }
            };

            await page.goto('/');
            await page.evaluate(async (data) => {
                await fetch('/api/webhooks/stripe?test=true', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'stripe-signature': 'test' },
                    body: JSON.stringify(data)
                });
            }, payload);

            // Wait for DB to update
            await expect.poll(async () => {
                const { data: profile } = await supabase.from('profiles').select('credits, tier').eq('id', testUserId).single();
                return profile;
            }, { timeout: 10000 }).toMatchObject({
                credits: plan.expectedCredits,
                tier: plan.expectedTier
            });

            console.log(`✅ ${plan.name} verified successfully.`);
        });
    }
});
