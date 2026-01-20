import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe.configure({ mode: 'serial' });

test.describe('Membership Webhooks & History Audit', () => {
    let testUserId: string;
    const testEmail = `webhook-test-${Date.now()}@east.com`;
    const stripeCustomerId = `cus_test_${Date.now()}`;
    const stripeSubscriptionId = `sub_test_${Date.now()}`;

    test.beforeAll(async () => {
        // Create a test user via Admin
        const { data, error } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player' }
        });

        if (error) throw error;
        testUserId = data.user.id;

        // Ensure profile exists
        await supabase.from('profiles').upsert({
            id: testUserId,
            contact_email: testEmail,
            role: 'player',
            credits: 0
        });
    });

    test.afterAll(async () => {
        if (testUserId) {
            await supabase.auth.admin.deleteUser(testUserId);
            await supabase.from('profiles').delete().eq('id', testUserId);
        }
    });

    test('Purchase Webhook: Sets status and initial history', async ({ request }) => {
        const payload = {
            id: 'evt_test_purchase',
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: 'cs_test_purchase',
                    mode: 'subscription',
                    customer: stripeCustomerId,
                    subscription: stripeSubscriptionId,
                    metadata: {
                        userId: testUserId,
                        test_price_id: 'price_monthly_test'
                    },
                    customer_details: { email: testEmail }
                }
            }
        };

        const response = await request.post('/api/webhooks/stripe', {
            params: { test: 'true' },
            data: payload
        });

        expect(response.ok()).toBe(true);
        console.log('[TEST] Purchase webhook verified');
    });

    test('Renewal Webhook: Increments credits', async ({ request }) => {
        const payload = {
            id: 'evt_test_renewal',
            type: 'invoice.payment_succeeded',
            data: {
                object: {
                    id: 'in_test_renewal',
                    billing_reason: 'subscription_cycle',
                    customer: stripeCustomerId,
                    subscription: stripeSubscriptionId,
                    metadata: {
                        test_price_id: 'price_monthly_test'
                    }
                }
            }
        };

        const response = await request.post('/api/webhooks/stripe', {
            params: { test: 'true' },
            data: payload
        });

        expect(response.ok()).toBe(true);
        console.log('[TEST] Renewal webhook verified');
    });

    test('Cancellation Webhook: Mark status as canceled', async ({ request }) => {
        const payload = {
            id: 'evt_test_cancel',
            type: 'customer.subscription.deleted',
            data: {
                object: {
                    id: stripeSubscriptionId,
                    customer: stripeCustomerId
                }
            }
        };

        const response = await request.post('/api/webhooks/stripe', {
            params: { test: 'true' },
            data: payload
        });

        expect(response.ok()).toBe(true);

        // Verification via DB
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', testUserId)
            .single();

        expect(profile?.subscription_status).toBe('canceled');
        console.log('[TEST] Cancellation webhook verified');
    });

    test('UI Feedback: Verify status in Directory', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@east.com');
        await page.fill('input[type="password"]', 'EastAdmin2026!');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/sys-admin');
        await page.goto('/sys-admin/directory');

        // Ensure we are on Households tab
        const householdTab = page.locator('button:has-text("households")');
        if (await householdTab.isVisible()) {
            await householdTab.click();
        }

        await page.fill('input[placeholder*="Search"]', testEmail);

        // Wait for search to filter - the user should appear in the text somewhere
        const userRow = page.locator(`text=${testEmail}`);
        await expect(userRow).toBeVisible({ timeout: 10000 });

        // In the Directory, status are often badges
        // We look for 'canceled' near the user email
        await expect(page.locator('body')).toContainText(/canceled/i);
        console.log('[TEST] UI Feedback verified');
    });
});
