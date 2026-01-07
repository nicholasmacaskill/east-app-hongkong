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
    const TOPUP_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP || 'price_1SkINl12ap1SCxToSkb1jrWV';
    const isTopUp = priceId === TOPUP_PRICE_ID;
    const mode = isTopUp ? 'payment' : 'subscription';

    console.log("Session Mode:", mode);

    // Default URLs if not provided
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const finalSuccessUrl = successUrl || `${baseUrl}/?success=true`;
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
      // ✅ UPDATED: Now includes credit_amount for metadata-driven webhook
      metadata: {
        userId: userId,
        target_user_id: userId,
        credit_amount: isTopUp ? '1200' : '0' // Default 1200 credits for standard top-up
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}