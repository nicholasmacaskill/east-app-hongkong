import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        // Client-side (NEXT_PUBLIC_)
        STRIPE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || 'MISSING',
        STRIPE_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || 'MISSING',
        STRIPE_CREDIT: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT || 'MISSING',
        STRIPE_TOPUP: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP || 'MISSING',

        // Server-side only
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? `sk_...${process.env.STRIPE_SECRET_KEY.slice(-10)}` : 'MISSING',
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? `whsec_...${process.env.STRIPE_WEBHOOK_SECRET.slice(-10)}` : 'MISSING',
    });
}
