import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/app/lib/email';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { checkRateLimit, paymentRateLimit, getClientIdentifier } from '@/app/lib/rateLimit';

// 1. Setup Stripe
// 1. Setup Stripe
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); (Lazy init below)
// Webhook secret (Updated: 2026-01-25)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// 2. Setup Supabase Admin (Bypass RLS)
// Initialize Admin Client lazily inside handler
// const supabaseAdmin = createClient(...) -> Removed top-level call

// Export for testing
export const PLAN_DETAILS: Record<string, { credits: number; tier: string }> = {};

// Individual (Pro)
const INDIVIDUAL_PRICES = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY,
].filter(Boolean);
INDIVIDUAL_PRICES.forEach(id => {
    PLAN_DETAILS[id!] = { credits: 1000, tier: 'individual' };
});

// Family 1 (Same price as Individual, but for parents)
const FAMILY_1_PRICES = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_MONTHLY
].filter(Boolean);
FAMILY_1_PRICES.forEach(id => {
    PLAN_DETAILS[id!] = { credits: 1000, tier: 'family_1' };
});

const INDIVIDUAL_YEARLY = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY,
].filter(Boolean);
INDIVIDUAL_YEARLY.forEach(id => {
    PLAN_DETAILS[id!] = { credits: 15000, tier: 'individual' }; // Yearly 15,000 credits
});

// Family 1 Yearly
const FAMILY_1_YEARLY = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_YEARLY
].filter(Boolean);
FAMILY_1_YEARLY.forEach(id => {
    PLAN_DETAILS[id!] = { credits: 15000, tier: 'family_1' };
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
        // 0. Check Rate Limit
        const identifier = getClientIdentifier(request);
        const rateLimitResult = await checkRateLimit(identifier, paymentRateLimit);
        if (!rateLimitResult.success) {
            return rateLimitResult.response;
        }

        const body = await request.text();

        // 🔍 DEBUG LOGGING 🔍
        const supabaseAdmin = getSupabaseAdmin();
        const { error: logError } = await supabaseAdmin.from('webhook_debug_logs').insert({
            event_type: 'INBOUND_REQUEST',
            payload: {
                method: request.method,
                url: request.url,
                body_snippet: body.substring(0, 500) // First 500 chars
            },
            status: 'RECEIVED'
        });
        if (logError) console.error("DB Log Failed:", logError);

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
        const url = new URL(request.url, 'http://localhost');
        const isTest = url.searchParams.get('test') === 'true';

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        let event: Stripe.Event;

        // 3. Signature Verification
        try {
            console.log(`[STRIPE WEBHOOK] isTest: ${isTest}, body length: ${body.length}, URL: ${request.url}`);
            if (!isTest) {
                const sig = headersList.get('stripe-signature');
                if (!sig) throw new Error('No stripe-signature header found');

                event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
                console.log(`✅ Webhook Signature Verified. Event: ${event.type}`);
            } else {
                event = JSON.parse(body) as Stripe.Event;
                console.log(`🧪 TEST MODE: Webhook Signature Bypassed. Event: ${event.type}`);
            }
        } catch (err: any) {
            console.error(`❌ Webhook Signature Error: ${err.message}`);
            return NextResponse.json({
                error: `Webhook Error: ${err.message}`,
                isTest,
                receivedUrl: request.url,
                bodyLength: body.length
            }, { status: 400 });
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
                let plan: { credits: number; tier: string };
                let expiresAt: string;
                let priceId: string;

                if (isTest && session.metadata?.test_price_id) {
                    priceId = session.metadata.test_price_id;
                    plan = PLAN_DETAILS[priceId] || { credits: 1000, tier: 'individual' };
                    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 days
                    console.log(`🧪 TEST MODE: Using test_price_id: ${priceId}`);
                } else {
                    // Retry fetching subscription with delay to allow Stripe to populate data
                    let subscription;
                    let periodEnd;

                    for (let attempt = 0; attempt < 3; attempt++) {
                        subscription = await stripe.subscriptions.retrieve(subscriptionId);
                        periodEnd = (subscription as any).current_period_end;

                        if (periodEnd && typeof periodEnd === 'number') {
                            break; // Success!
                        }

                        if (attempt < 2) {
                            console.log(`⏳ Subscription data incomplete (attempt ${attempt + 1}/3), retrying in 2s...`);
                            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                        }
                    }

                    priceId = subscription!.items.data[0].price.id;
                    plan = PLAN_DETAILS[priceId] || { credits: 1000, tier: 'individual' };

                    if (!periodEnd || typeof periodEnd !== 'number') {
                        console.warn(`⚠️ Subscription still missing current_period_end after retries. Using default (+30 days). Subscription:`, subscriptionId);
                        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                    } else {
                        expiresAt = new Date(periodEnd * 1000).toISOString();
                    }
                }

                if (!plan.tier || plan.tier === 'individual' && !PLAN_DETAILS[priceId]) {
                    console.warn(`[STRIPE WEBHOOK] ⚠️ UNKNOWN PRICE ID: ${priceId}. Defaulting to Individual plan.`);
                }
                console.log(`Processing Subscription: ${plan.tier.toUpperCase()} for User: ${userId} (Price ID: ${priceId})`);

                if (userId) {
                    await updateProfile(userId, plan.credits, plan.tier, customerId, subscriptionId, expiresAt);
                    if (customerEmail) {
                        try {
                            const userName = session.customer_details?.name || 'there';
                            const amount = session.amount_total ? (session.amount_total / 100).toLocaleString('en-HK', { style: 'currency', currency: 'HKD' }) : 'N/A';
                            const startDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                            const renewalDate = new Date(expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
                            const tierName = plan.tier.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                            const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://east-app-hongkong.vercel.app';

                            await sendEmail({
                                to: customerEmail,
                                subject: `Welcome to the EAST ${tierName} Membership`,
                                html: `
                                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #ffffff; font-size: 16px; line-height: 1.6;">
                                        <h2 style="font-size: 24px; color: #ffffff; margin-bottom: 20px;">Welcome to the EAST ${tierName} Membership</h2>
                                        <p>Hi ${userName},</p>
                                        <p>Thank you for signing up for a membership with the EAST App!</p>
                                        <p>We're excited to have you on board. Your payment has been successfully processed, and your membership is now active. Here are the details of your subscription:</p>
                                        <ul style="padding-left: 20px; margin-bottom: 30px;">
                                            <li><strong>Membership Type:</strong> ${tierName}</li>
                                            <li><strong>Start Date:</strong> ${startDate}</li>
                                            <li><strong>Renewal Date:</strong> ${renewalDate}</li>
                                            <li><strong>Payment Amount:</strong> ${amount}</li>
                                            <li><strong>Credits:</strong> ${plan.credits}</li>
                                        </ul>

                                        <div style="text-align: center; margin: 40px 0;">
                                            <a href="${appUrl}/sessions" style="background-color: #ffffff; color: #000000; padding: 16px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; font-size: 14px; display: inline-block;">
                                                Book your first session
                                            </a>
                                        </div>

                                        <p>You can access your membership benefits immediately:</p>
                                        <ul style="padding-left: 20px; margin-bottom: 30px;">
                                            <li>Access to the High Performance Centre Gym & Lounge</li>
                                            <li>Bookings</li>
                                            <li>Calendar</li>
                                            <li>Special Events</li>
                                        </ul>
                                        <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
                                        <p>Thank you for choosing EAST!</p>
                                        <p>Best regards,<br>The EAST App Team</p>
                                    </div>
                                `
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
                            html: `<div style="color: #ffffff;"><h1>Top Up Successful!</h1><p>You have purchased <strong>${creditAmount} credits</strong>.</p></div>`
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

                let plan: { credits: number; tier: string };
                let currentPeriodEnd: number;

                if (isTest && invoice.metadata?.test_price_id) {
                    const testPriceId = invoice.metadata.test_price_id;
                    plan = PLAN_DETAILS[testPriceId] || { credits: 1000, tier: 'individual' };
                    currentPeriodEnd = Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000);
                    console.log(`🧪 TEST MODE: Processing renewal for test_price_id: ${testPriceId}`);
                } else {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = subscription.items.data[0].price.id;
                    plan = PLAN_DETAILS[priceId] || { credits: 1000, tier: 'individual' };
                    currentPeriodEnd = (subscription as any).current_period_end;
                }

                const supabaseAdmin = getSupabaseAdmin();
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('id, tier')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (profile) {
                    await handleRenewal(profile.id, plan.credits, 'membership', invoice.id, `Monthly renewal: ${plan.credits} credits`, currentPeriodEnd);

                    // NEW: If family plan, extend children's membership too
                    if (profile.tier && profile.tier.startsWith('family')) {
                        console.log(`🚸 Family renewal: Extending children's membership for parent ${profile.id}`);

                        const expiresAt = new Date(currentPeriodEnd * 1000).toISOString();
                        const { data: children, error: childError } = await supabaseAdmin
                            .from('profiles')
                            .select('id, first_name')
                            .eq('parent_id', profile.id);

                        if (children && children.length > 0) {
                            for (const child of children) {
                                await supabaseAdmin
                                    .from('profiles')
                                    .update({ membership_expires: expiresAt })
                                    .eq('id', child.id);

                                console.log(`✅ Extended child membership: ${child.first_name || child.id}`);
                            }
                        }
                    }
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

            // We keep the expiry date as is (user access remains until end of period),
            // but mark status as canceled so no new credits/charges occur.
            const { data: parentProfile } = await supabaseAdmin
                .from('profiles')
                .select('id, tier')
                .eq('stripe_customer_id', customerId)
                .single();

            if (parentProfile) {
                await supabaseAdmin
                    .from('profiles')
                    .update({
                        subscription_status: 'cancelled',
                        // Optional: You could ensure expires matches subscription.current_period_end * 1000
                    })
                    .eq('id', parentProfile.id);

                // NEW: If family plan, cancel children's subscriptions too
                if (parentProfile.tier && parentProfile.tier.startsWith('family')) {
                    console.log(`🚸 Family cancellation: Marking children as cancelled for parent ${parentProfile.id}`);

                    const { data: children } = await supabaseAdmin
                        .from('profiles')
                        .select('id, first_name')
                        .eq('parent_id', parentProfile.id);

                    if (children && children.length > 0) {
                        for (const child of children) {
                            await supabaseAdmin
                                .from('profiles')
                                .update({ subscription_status: 'cancelled' })
                                .eq('id', child.id);

                            console.log(`✅ Cancelled child subscription: ${child.first_name || child.id}`);
                        }
                    }
                }
            }
        }

        // ====================================================
        // D. Handle Subscription Updates (Status Changes)
        // ====================================================
        if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            const status = subscription.status; // active, past_due, unpaid, canceled

            console.log(`[STRIPE WEBHOOK] Subscription Update: Customer ${customerId} status -> ${status}`);

            const supabaseAdmin = getSupabaseAdmin();

            // Sync status. 'past_due'/'unpaid' will trigger Locked UI.
            // 'active' will Unlock UI.
            // Sync status. 'past_due'/'unpaid' will trigger Locked UI.
            // 'active' will Unlock UI.
            const { data: parentProfile, error } = await supabaseAdmin
                .from('profiles')
                .update({ subscription_status: status })
                .eq('stripe_customer_id', customerId)
                .select('id, tier')
                .single();

            if (error) {
                console.error(`❌ DB Error updating subscription status: ${error.message}`);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            console.log(`✅ DB Success: Updated subscription_status to '${status}'`);

            // NEW: Propagate status to children for family plans
            if (parentProfile && parentProfile.tier && parentProfile.tier.startsWith('family')) {
                console.log(`🚸 Family status update: Syncing children to '${status}' for parent ${parentProfile.id}`);

                // Find children
                const { data: children } = await supabaseAdmin
                    .from('profiles')
                    .select('id, first_name')
                    .eq('parent_id', parentProfile.id);

                if (children && children.length > 0) {
                    for (const child of children) {
                        await supabaseAdmin
                            .from('profiles')
                            .update({ subscription_status: status })
                            .eq('id', child.id);

                        console.log(`✅ Synced child status: ${child.first_name || child.id} -> ${status}`);
                    }
                }
            }
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

async function updateProfile(userId: string, creditsToAdd: number, tier: string, customerId: string, subscriptionId: string, expiresAt: string) {
    // 1. Fetch current credits
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
    const currentCredits = profile?.credits || 0;

    // 2. Upsert profile
    console.log(`[STRIPE WEBHOOK] Updating profile for ${userId}. Credits: ${currentCredits} -> ${currentCredits + creditsToAdd}, Status: active`);
    const { error } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId,
            credits: currentCredits + creditsToAdd,
            subscription_status: 'active',
            account_status: 'active', // Explicitly unlock on purchase
            tier: tier,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            membership_start: new Date().toISOString(), // Member since NOW
            membership_expires: expiresAt
        }, { onConflict: 'id' });

    if (error) {
        console.error("❌ DB Upsert Failed:", error);
        throw error; // Rethrow to catch in handler
    }

    console.log(`✅ DB Success: Upserted profile. Added ${creditsToAdd} credits.`);

    // 3. Log Transaction
    await logTransaction(userId, creditsToAdd, 'membership', subscriptionId, `Initial membership purchase: ${creditsToAdd} credits`);

    // 4. NEW: If family plan, activate all associated children
    if (tier.startsWith('family')) {
        console.log(`🚸 Family plan detected (${tier}). Activating children for parent: ${userId}`);

        const { data: children, error: childError } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, contact_email')
            .eq('parent_id', userId);

        if (childError) {
            console.error(`❌ Error fetching children:`, childError);
        } else if (children && children.length > 0) {
            console.log(`📝 Found ${children.length} children to activate`);

            for (const child of children) {
                const { error: updateError } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        subscription_status: 'active',
                        account_status: 'active',
                        membership_start: new Date().toISOString(),
                        membership_expires: expiresAt
                    })
                    .eq('id', child.id);

                if (updateError) {
                    console.error(`❌ Failed to activate child ${child.id}:`, updateError);
                } else {
                    console.log(`✅ Activated child: ${child.first_name || child.contact_email || child.id}`);
                }
            }
        } else {
            console.log(`⚠️ No children found for parent ${userId} (family plan purchased but no linked children yet)`);
        }
    }
}

// Handles Renewals
async function handleRenewal(userId: string, creditsToAdd: number, type: 'topup' | 'membership', sessionId: string, description: string, newPeriodEnd: number) {
    const supabaseAdmin = getSupabaseAdmin();

    // Check idempotency
    const { data: existing } = await supabaseAdmin.from('transactions').select('id').eq('stripe_session_id', sessionId).single();
    if (existing) return;

    const { data: profile } = await supabaseAdmin.from('profiles').select('credits, membership_expires, membership_history, tier').eq('id', userId).single();
    const currentCredits = profile?.credits || 0;
    const oldHistory = Array.isArray(profile?.membership_history) ? profile.membership_history : [];

    // Archive current period
    const historyEntry = {
        action: 'renewal',
        date: new Date().toISOString(),
        previous_expires: profile?.membership_expires,
        tier: profile?.tier
    };

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({
            credits: currentCredits + creditsToAdd,
            membership_expires: new Date(newPeriodEnd * 1000).toISOString(),
            membership_history: [...oldHistory, historyEntry]
        })
        .eq('id', userId);

    if (error) {
        console.error("❌ DB Renewal Update Failed:", error);
        throw error;
    } else {
        console.log(`✅ DB Success: Renewal processed. Added ${creditsToAdd} credits.`);
        await logTransaction(userId, creditsToAdd, type, sessionId, description);
    }
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

    console.log(`[STRIPE WEBHOOK] Adding ${creditsToAdd} credits to ${userId}. Current: ${currentCredits}`);
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({
            credits: currentCredits + creditsToAdd,
            account_status: 'active', // Unlock on top-up too
        })
        .eq('id', userId);

    if (error) {
        console.error(`[STRIPE WEBHOOK] DB Update Failed for ${userId}:`, error);
        throw error;
    }
    console.log(`✅ [STRIPE WEBHOOK] Credits added and account unlocked for ${userId}`);

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