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

    // Determine mode based on Price ID (Top Up is one-time payment)
    const TOPUP_RATES: Record<string, number> = {};

    const topupKeys = {
      STARTER: 500,
      STANDARD: 1000,
      PRO: 2500,
      ELITE: 5000,
      ULTIMATE: 10000,
      TOPUP: 1200 // Legacy support
    };

    Object.entries(topupKeys).forEach(([key, amount]) => {
      const priceIdFromEnv = getStripePriceId(key);
      if (priceIdFromEnv) {
        TOPUP_RATES[priceIdFromEnv] = amount;
      }
    });

    const topUpAmount = TOPUP_RATES[priceId];
    const isTopUp = !!topUpAmount;

    const mode = isTopUp ? 'payment' : 'subscription';

    console.log("Session Mode:", mode, "Credit Amount:", topUpAmount);

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