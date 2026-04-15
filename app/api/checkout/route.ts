// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { BASE_URL } from '@/app/lib/email';
import { getStripeSecretKey, getStripePriceId } from '@/app/lib/stripe-config';

export async function POST(request: Request) {
  try {
    const { priceId, userId, userEmail, successUrl, cancelUrl } = await request.json();

    const secretKey = getStripeSecretKey();
    if (!secretKey) {
      console.error("CRITICAL: Stripe Secret Key is missing for the current mode.");
      return NextResponse.json({ error: 'Server Error: Stripe configuration error.' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);

    console.log("---- CHECKOUT REQUEST RECEIVED ----");
    console.log("Price ID:", priceId);
    console.log("User ID:", userId);
    console.log("Email:", userEmail);

    if (!priceId || !userId) {
      console.error("Missing Params - Price:", priceId, "User:", userId);
      return NextResponse.json({ error: 'Missing priceId or userId' }, { status: 400 });
    }

    // 1. Fetch Price details from Stripe to determine mode dynamically
    const price = await stripe.prices.retrieve(priceId);
    if (!price) {
      return NextResponse.json({ error: 'Invalid Price ID' }, { status: 400 });
    }

    // Determine mode based on whether the price is recurring
    const isRecurring = !!price.recurring;
    const mode = isRecurring ? 'subscription' : 'payment';

    // 2. Identify Top-Up amounts for metadata (Optional but helpful for credits)
    // We can still use a map for internal credit logic if needed, 
    // or just pass it from the frontend.
    const TOPUP_MAP: Record<string, number> = {
      [getStripePriceId('TOPUP_STARTER')]: 500,     // HKD $500   → 500 credits  (no bonus)
      [getStripePriceId('TOPUP_STANDARD')]: 1200,   // HKD $1,000 → 1,200 credits (+200 bonus)
      [getStripePriceId('TOPUP_PRO')]: 3000,        // HKD $2,500 → 3,000 credits (+500 bonus)
      [getStripePriceId('TOPUP_ELITE')]: 6000,      // HKD $5,000 → 6,000 credits (+1,000 bonus)
      [getStripePriceId('TOPUP_ULTIMATE')]: 12000,  // HKD $10,000 → 12,000 credits (+2,000 bonus)
      [getStripePriceId('TOPUP')]: 1200
    };

    const topUpAmount = TOPUP_MAP[priceId] || 0;
    const isTopUp = !isRecurring && topUpAmount > 0;

    console.log(`Session Mode: ${mode} | Recurring: ${isRecurring} | TopUp Amount: ${topUpAmount}`);

    // Default URLs if not provided
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    const detectedBaseUrl = origin || (referer ? new URL(referer).origin : null);
    const baseUrl = BASE_URL || detectedBaseUrl || 'http://localhost:3000';

    let defaultSuccessPath = '/?success=true';
    if (mode === 'subscription') {
      defaultSuccessPath = '/membership/success';
    }

    const finalSuccessUrl = successUrl || `${baseUrl}${defaultSuccessPath}`;
    const finalCancelUrl = cancelUrl || `${baseUrl}/?canceled=true`;

    // 3. Create a Stripe Checkout Session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: mode,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        target_user_id: userId,
        credit_amount: topUpAmount.toString()
      }
    };

    // For subscriptions, ensure metadata is passed to the subscription object
    if (mode === 'subscription') {
      sessionConfig.subscription_data = {
        metadata: {
          userId: userId,
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}