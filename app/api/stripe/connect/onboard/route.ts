import { NextResponse } from 'next/server';
import { requireSysAdmin } from '@/app/lib/require-sys-admin';
import {
  createConnectOnboardingLink,
  isStripeConnectEnabled,
} from '@/app/lib/stripe-connect';

export async function POST() {
  const auth = await requireSysAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isStripeConnectEnabled()) {
    return NextResponse.json(
      { error: 'Stripe Connect is disabled for this deployment.' },
      { status: 400 }
    );
  }

  try {
    const url = await createConnectOnboardingLink();
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('[stripe-connect] onboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}