import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/app/lib/email';

// 1. Setup Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// 2. Setup Supabase Admin (Bypass RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// 3. CONFIG: Map Price IDs to Credits & Tiers
// ✅ FIX: This ensures Elite members get 3500 credits, not 1000.
const PLAN_DETAILS: Record<string, { credits: number; tier: string }> = {};
if (process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY) {
    PLAN_DETAILS[process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY] = { credits: 3500, tier: 'elite' };
}
if (process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY) {
    PLAN_DETAILS[process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY] = { credits: 3500, tier: 'elite' };
}

export async function POST(request: Request) {
    const body = await request.text();

    // ✅ FIX: Await headers() before accessing properties (Required for Next.js 15/16)
    const headersList = await headers();
    const sig = headersList.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
        console.log(`✅ Webhook Signature Verified. Event: ${event.type}`);
    } catch (err: any) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // ====================================================
    // 1. Handle Initial Subscription Purchase (Checkout)
    // ====================================================
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerEmail = session.customer_details?.email;

        // --- A. SUBSCRIPTION PURCHASE ---
        if (session.mode === 'subscription') {
            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;

            // Fetch plan details
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0].price.id;
            const plan = PLAN_DETAILS[priceId] || { credits: 1000, tier: 'gym' };

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

        // --- B. ONE-TIME TOP UP ---
        else if (session.mode === 'payment') {
            console.log(`Processing One-time Payment for User: ${userId}`);

            // Retrieve line items to check if it's the Top Up
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            const priceId = lineItems.data[0]?.price?.id;

            const TOPUP_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP || 'price_1SkINl12ap1SCxToSkb1jrWV';
            console.log(`[WEBHOOK] Check TopUp vs Payment. Received: ${priceId}, Expected: ${TOPUP_PRICE_ID}`);

            if (priceId === TOPUP_PRICE_ID) {
                const TOPUP_CREDITS = 1200;
                console.log(`Identified Top-Up. Adding ${TOPUP_CREDITS} credits.`);

                if (userId) {
                    await addCreditsOnly(userId, TOPUP_CREDITS);
                    if (customerEmail) {
                        try {
                            await sendEmail({
                                to: customerEmail,
                                subject: 'Credits Top Up Confirmed',
                                html: `<h1>Top Up Successful!</h1><p>You have successfully purchased <strong>${TOPUP_CREDITS} credits</strong>.</p><p>These have been added to your balance.</p>`
                            });
                        } catch (e) { console.error("Email failed, but DB updated."); }
                    }
                }
            } else {
                console.warn(`[WEBHOOK] Price mismatch. Session ${session.id} had price ${priceId}`);
            }
        }
    }

    // ====================================================
    // 2. Handle Monthly Recurring Payments (Renewals)
    // ====================================================
    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as Stripe.Invoice;

        // Check if this is a subscription renewal
        if (invoice.billing_reason === 'subscription_cycle') {
            const customerId = invoice.customer as string;
            const customerEmail = invoice.customer_email;
            const subscriptionId = (invoice as any).subscription as string;

            console.log(`Processing Monthly Renewal for Stripe Customer: ${customerId}`);

            // ✅ FETCH PLAN DETAILS AGAIN (So renewals also get the right amount)
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0].price.id;
            const plan = PLAN_DETAILS[priceId] || { credits: 1000, tier: 'gym' };

            // Find user by Stripe Customer ID
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('stripe_customer_id', customerId)
                .single();

            if (profile) {
                console.log(`Found User ID: ${profile.id}. Adding monthly ${plan.credits} credits...`);

                // Add monthly credits based on the plan they are on
                await addCreditsOnly(profile.id, plan.credits);

                // Send Renewal Email
                if (customerEmail) {
                    try {
                        await sendEmail({
                            to: customerEmail,
                            subject: 'Monthly Credits Added',
                            html: `
                        <p>Your monthly membership payment was successful.</p>
                        <p><strong>${plan.credits} credits</strong> have been added to your account.</p>
                        `
                        });
                    } catch (e) { console.error("Email failed, but DB updated."); }
                }
            } else {
                console.error(`❌ Could not find user associated with Stripe Customer: ${customerId}`);
            }
        }
    }

    return NextResponse.json({ received: true });
}

// ====================================================
// Helper Functions
// ====================================================

async function updateProfile(userId: string, creditsToAdd: number, tier: string, customerId: string, subscriptionId: string) {
    // 1. Fetch current credits
    // This is needed to get the existing credit count before adding new ones
    const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
    const currentCredits = profile?.credits || 0;

    // 2. Use upsert instead of update.
    // This fixes the issue where credits are not added if the profile row doesn't exist yet
    // (e.g., due to a race condition on initial sign-up).
    const { error } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId, // ✅ Must include the primary key for upsert
            credits: currentCredits + creditsToAdd,
            subscription_status: 'active',
            tier: tier,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId
        }, { onConflict: 'id' }); // ✅ Conflict target is the primary key

    // Update console logging to reflect the change
    if (error) console.error("❌ DB Upsert Failed:", error);
    else console.log(`✅ DB Success: Upserted profile. Added ${creditsToAdd} credits, set tier to ${tier}.`);
}

async function addCreditsOnly(userId: string, creditsToAdd: number) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
    const currentCredits = profile?.credits || 0;

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({
            credits: currentCredits + creditsToAdd,
        })
        .eq('id', userId);

    if (error) console.error("❌ DB Renewal Update Failed:", error);
    else console.log("✅ DB Renewal Success: Monthly credits added.");
}