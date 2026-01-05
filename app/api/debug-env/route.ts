import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        STRIPE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || 'MISSING',
        STRIPE_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || 'MISSING',
        STRIPE_CREDIT: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT || 'MISSING',
        STRIPE_TOPUP: process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP || 'MISSING',
    });
}
