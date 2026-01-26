// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); (Lazy init below)

export async function POST(request: Request) {
  try {
    const { priceId, userId, userEmail, successUrl, cancelUrl } = await request.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("CRITICAL: STRIPE_SECRET_KEY is missing in environment variables.");
      return NextResponse.json({ error: 'Server Error: Stripe Secret Key is missing.' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    console.log("---- CHECKOUT REQUEST RECEIVED ----");
    console.log("Price ID:", priceId);
    console.log("User ID:", userId);
    console.log("Email:", userEmail);

    if (!priceId || !userId) {
      console.error("Missing Params - Price:", priceId, "User:", userId);
      return NextResponse.json({ error: 'Missing priceId or userId' }, { status: 400 });
    }

    // Determine mode based on Price ID (Top Up is one-time payment)
    const TOPUP_RATES: Record<string, number> = {};

    // Dynamic mapping from Env Vars
    if (process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STARTER) TOPUP_RATES[process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STARTER] = 500;
    if (process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STANDARD) TOPUP_RATES[process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STANDARD] = 1000;
    if (process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_PRO) TOPUP_RATES[process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_PRO] = 2500;
    if (process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ELITE) TOPUP_RATES[process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ELITE] = 5000;
    if (process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ULTIMATE) TOPUP_RATES[process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ULTIMATE] = 10000;

    // Legacy Support (Optional - can be removed if strictly using new env vars)
    // if (process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP) TOPUP_RATES[process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP] = 1200;

    const topUpAmount = TOPUP_RATES[priceId];
    const isTopUp = !!topUpAmount;

    const mode = isTopUp ? 'payment' : 'subscription';

    console.log("Session Mode:", mode, "Credit Amount:", topUpAmount);

    // Default URLs if not provided
    const origin = request.headers.get('origin');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin || 'http://localhost:3000';

    let defaultSuccessPath = '/?success=true';
    if (mode === 'subscription') {
      defaultSuccessPath = '/membership/success';
    }

    const finalSuccessUrl = successUrl || `${baseUrl}${defaultSuccessPath}`;
    const finalCancelUrl = cancelUrl || `${baseUrl}/?canceled=true`;

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: mode,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],

      // Redirect URLs
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,

      // Pre-fill user email to simplify checkout
      customer_email: userEmail,

      // For subscriptions, ensure metadata is passed to the subscription object
      ...(mode === 'subscription' && {
        subscription_data: {
          metadata: {
            userId: userId,
          }
        }
      }),

      // Metadata allows us to match the payment to the user in the Webhook
      // ✅ UPDATED: Dynamic credit_amount from map
      metadata: {
        userId: userId,
        target_user_id: userId,
        credit_amount: isTopUp ? topUpAmount.toString() : '0'
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}