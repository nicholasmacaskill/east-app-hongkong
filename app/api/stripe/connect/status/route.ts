import { NextResponse } from 'next/server';
import { requireSysAdmin } from '@/app/lib/require-sys-admin';
import {
  getPlatformStripeSettings,
  isStripeConnectEnabled,
  refreshConnectedAccountStatus,
} from '@/app/lib/stripe-connect';

export async function GET(request: Request) {
  const auth = await requireSysAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get('refresh') === 'true';

  try {
    let settings = await getPlatformStripeSettings();

    if (refresh && settings.stripe_account_id) {
      settings = await refreshConnectedAccountStatus(settings.stripe_account_id);
    }

    return NextResponse.json({
      connectEnabled: isStripeConnectEnabled(),
      ...settings,
      readyForCheckout:
        !!settings.stripe_account_id && settings.stripe_charges_enabled,
    });
  } catch (error: any) {
    console.error('[stripe-connect] status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}