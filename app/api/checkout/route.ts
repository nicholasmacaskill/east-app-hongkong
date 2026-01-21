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
    const TOPUP_RATES: Record<string, number> = {
      // 500 Credits ($500)
      'price_1SkINl12ap1SCxTolaVPqdzA': 500,
      // 1000 Credits ($1000) / Standard Top-up
      'price_1SkINl12ap1SCxToIyvikBgt': 1000,
      'price_1SkINl12ap1SCxToSkb1jrWV': 1200, // Current NEXT_PUBLIC_STRIPE_PRICE_TOPUP
      // 2500 Credits ($2500)
      'price_1SkINl12ap1SCxTodZWHrIQm': 2500,
      // 5000 Credits ($5000)
      'price_1SkINl12ap1SCxToJvTqg6wj': 5000,
      // 10000 Credits ($10000)
      'price_1SkINl12ap1SCxTotmD50PGA': 10000
    };

    // Check if provided ID is in our known Top Up list
    // Fallback: Check environment variable just in case legacy env check is needed
    const LEGACY_TOPUP_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP;
    if (LEGACY_TOPUP_ID && !TOPUP_RATES[LEGACY_TOPUP_ID]) {
      TOPUP_RATES[LEGACY_TOPUP_ID] = 1200; // Default legacy amount
    }

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