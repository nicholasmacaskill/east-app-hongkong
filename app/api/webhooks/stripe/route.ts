import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/app/lib/email';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

// 1. Setup Stripe
// 1. Setup Stripe
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); (Lazy init below)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// 2. Setup Supabase Admin (Bypass RLS)
// Initialize Admin Client lazily inside handler
// const supabaseAdmin = createClient(...) -> Removed top-level call

// Export for testing
export const PLAN_DETAILS: Record<string, { credits: number; tier: string }> = {};

// Individual (Pro) & Family 1 (Same Price)
const INDIVIDUAL_PRICES = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_MONTHLY
].filter(Boolean);
INDIVIDUAL_PRICES.forEach(id => {
    PLAN_DETAILS[id!] = { credits: 1000, tier: 'individual' };
});

const INDIVIDUAL_YEARLY = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_YEARLY
].filter(Boolean);
INDIVIDUAL_YEARLY.forEach(id => {
    PLAN_DETAILS[id!] = { credits: 15000, tier: 'individual' }; // Yearly 15,000 credits
});

// Family 2
if (process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY) {
    PLAN_DETAILS[process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY] = { credits: 2500, tier: 'family_2' };
}
if (process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY) {
    PLAN_DETAILS[process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY] = { credits: 33000, tier: 'family_2' };
}

// Family 3+
if (process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY) {
    PLAN_DETAILS[process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY] = { credits: 3500, tier: 'family_3plus' };
}
if (process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY) {
    PLAN_DETAILS[process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY] = { credits: 45000, tier: 'family_3plus' };
}

export async function POST(request: Request) {
    try {
        const body = await request.text();

        // 1. Diagnostics & Runtime Check
        console.log(`[STRIPE WEBHOOK] Inbound Request. Method: ${request.method}, URL: ${request.url}`);

        // Check for required environment variables
        const requiredEnv = [
            'STRIPE_SECRET_KEY',
            'STRIPE_WEBHOOK_SECRET',
            'NEXT_PUBLIC_SUPABASE_URL',
            'SUPABASE_SERVICE_ROLE_KEY'
        ];
        const missing = requiredEnv.filter(k => !process.env[k]);
        if (missing.length > 0) {
            console.error(`❌ CRITICAL ERROR: Missing environment variables: ${missing.join(', ')}`);
            return NextResponse.json({
                error: 'Configuration Error',
                missing_vars: missing
            }, { status: 500 });
        }

        // 2. Setup Headers & Signature
        const headersList = await headers();
        const sig = headersList.get('stripe-signature')!;
        const { searchParams } = new URL(request.url);
        const isTest = searchParams.get('test') === 'true';

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        let event: Stripe.Event;

        // 3. Signature Verification
        try {
            if (!isTest) {
                event = stripe.webhooks.constructEvent(body, sig || '', endpointSecret);
                console.log(`✅ Webhook Signature Verified. Event: ${event.type}`);
            } else {
                event = JSON.parse(body) as Stripe.Event;
                console.log(`🧪 TEST MODE: Webhook Signature Bypassed. Event: ${event.type}`);
            }
        } catch (err: any) {
            console.error(`❌ Webhook Signature Error: ${err.message}`);
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }

        // 4. Processing Handlers
        // ====================================================
        // A. Handle Initial Subscription Purchase (Checkout)
        // ====================================================
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;
            const customerEmail = session.customer_details?.email;

            // --- A1. SUBSCRIPTION PURCHASE ---
            if (session.mode === 'subscription') {
                const subscriptionId = session.subscription as string;
                const customerId = session.customer as string;
                let priceId: string;

                if (isTest && session.metadata?.test_price_id) {
                    priceId = session.metadata.test_price_id;
                    console.log(`🧪 TEST MODE: Using test_price_id: ${priceId}`);
                } else {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    priceId = subscription.items.data[0].price.id;
                }

                const plan = PLAN_DETAILS[priceId] || { credits: 1000, tier: 'individual' };

                console.log(`Processing Subscription: ${plan.tier.toUpperCase()} for User: ${userId}`);

                if (userId) {
                    await updateProfile(userId, plan.credits, plan.tier, customerId, subscriptionId);
                    if (customerEmail) {
                        try {
                            await sendEmail({
                                to: customerEmail,
                                subject: `Welcome to EAST - ${plan.tier.toUpperCase()} Member`,
                                html: `<h1>Membership Confirmed!</h1><p>Thank you for joining. Your account has been credited with <strong>${plan.credits} credits</strong>.</p>`
                            });
                        } catch (e) { console.error("Email failed, but DB updated."); }
                    }
                }
            }

            // --- A2. ONE-TIME TOP UP ---
            else if (session.mode === 'payment') {
                console.log(`Processing One-time Payment for Session: ${session.id}`);
                const metadata = session.metadata || {};
                const creditAmount = parseInt(metadata.credit_amount || '0');
                const targetUserId = metadata.target_user_id || userId;

                let priceId = 'test_price';
                if (!isTest) {
                    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
                    priceId = lineItems.data[0]?.price?.id || 'unknown';
                }

                if (!creditAmount || creditAmount <= 0 || !targetUserId) {
                    console.error(`❌ CRITICAL: Invalid metadata for session ${session.id}`);
                    return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
                }

                await addCreditsOnly(targetUserId, creditAmount, 'topup', session.id, `Top-up purchase: ${creditAmount} credits`);

                if (customerEmail) {
                    try {
                        await sendEmail({
                            to: customerEmail,
                            subject: 'Credits Top Up Confirmed',
                            html: `<h1>Top Up Successful!</h1><p>You have purchased <strong>${creditAmount} credits</strong>.</p>`
                        });
                    } catch (e) { console.error("Email failed, but DB updated."); }
                }
            }
        }

        // ====================================================
        // B. Handle Monthly Recurring Payments (Renewals)
        // ====================================================
        if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object as Stripe.Invoice;
            if (invoice.billing_reason === 'subscription_cycle') {
                const customerId = invoice.customer as string;
                const subscriptionId = (invoice as any).subscription as string;

                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const priceId = subscription.items.data[0].price.id;
                const plan = PLAN_DETAILS[priceId] || { credits: 1000, tier: 'individual' };

                const supabaseAdmin = getSupabaseAdmin();
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (profile) {
                    await addCreditsOnly(profile.id, plan.credits, 'membership', invoice.id, `Monthly renewal: ${plan.credits} credits`);
                }
            }
        }

        // ====================================================
        // C. Handle Subscription Cancellations
        // ====================================================
        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            const supabaseAdmin = getSupabaseAdmin();
            await supabaseAdmin
                .from('profiles')
                .update({ subscription_status: 'canceled' })
                .eq('stripe_customer_id', customerId);
        }

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error(`🔥 UNHANDLED ERROR IN WEBHOOK: ${err.message}`);
        console.error(err.stack);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 });
    }
}

// ====================================================
// Helper Functions
// ====================================================

async function updateProfile(userId: string, creditsToAdd: number, tier: string, customerId: string, subscriptionId: string) {
    // 1. Fetch current credits
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
    const currentCredits = profile?.credits || 0;

    // 2. Upsert profile
    const { error } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId,
            credits: currentCredits + creditsToAdd,
            subscription_status: 'active',
            tier: tier,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId
        }, { onConflict: 'id' });

    if (error) {
        console.error("❌ DB Upsert Failed:", error);
        throw error; // Rethrow to catch in handler
    }

    console.log(`✅ DB Success: Upserted profile. Added ${creditsToAdd} credits.`);

    // 3. Log Transaction
    await logTransaction(userId, creditsToAdd, 'membership', subscriptionId, `Initial membership purchase: ${creditsToAdd} credits`);
}

async function addCreditsOnly(userId: string, creditsToAdd: number, type: 'topup' | 'membership' | 'transfer' | 'booking' | 'refund' = 'topup', sessionId?: string, description?: string) {
    const supabaseAdmin = getSupabaseAdmin();

    // Check for idempotency if sessionId provided
    if (sessionId) {
        const { data: existing } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('stripe_session_id', sessionId)
            .single();

        if (existing) {
            console.log(`⚠️ Transaction ${sessionId} already processed. Skipping credit addition.`);
            return;
        }
    }

    const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
    const currentCredits = profile?.credits || 0;

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({
            credits: currentCredits + creditsToAdd,
        })
        .eq('id', userId);

    if (error) {
        console.error("❌ DB Renewal Update Failed:", error);
        throw error;
    } else {
        console.log(`✅ DB Success: Added ${creditsToAdd} credits.`);
        await logTransaction(userId, creditsToAdd, type, sessionId, description);
    }
}

async function logTransaction(userId: string, amount: number, type: string, sessionId?: string, description?: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
        .from('transactions')
        .insert({
            user_id: userId,
            amount: amount,
            type: type,
            stripe_session_id: sessionId,
            description: description
        });

    if (error) console.error("❌ Failed to log transaction:", error);
}