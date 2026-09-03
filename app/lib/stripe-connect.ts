import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { getStripeSecretKey } from '@/app/lib/stripe-config';
import { BASE_URL } from '@/app/lib/email';

export const PLATFORM_SETTINGS_ID = 'platform';

export interface PlatformStripeSettings {
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
  stripe_onboarding_complete: boolean;
}

const DEFAULT_SETTINGS: PlatformStripeSettings = {
  stripe_account_id: null,
  stripe_charges_enabled: false,
  stripe_payouts_enabled: false,
  stripe_details_submitted: false,
  stripe_onboarding_complete: false,
};

export function getPlatformStripeClient(): Stripe | null {
  const secretKey = getStripeSecretKey();
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

export function isStripeConnectEnabled(): boolean {
  return process.env.STRIPE_CONNECT_ENABLED !== 'false';
}

export function getConnectCountry(): string {
  return process.env.STRIPE_CONNECT_COUNTRY || 'US';
}

export async function getPlatformStripeSettings(): Promise<PlatformStripeSettings> {
  const envAccountId = process.env.STRIPE_CONNECTED_ACCOUNT_ID?.trim();
  if (envAccountId) {
    return {
      stripe_account_id: envAccountId,
      stripe_charges_enabled: true,
      stripe_payouts_enabled: true,
      stripe_details_submitted: true,
      stripe_onboarding_complete: true,
    };
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .select(
        'stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, stripe_onboarding_complete'
      )
      .eq('id', PLATFORM_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.warn('[stripe-connect] platform_settings unavailable:', error.message);
      return DEFAULT_SETTINGS;
    }

    if (!data) return DEFAULT_SETTINGS;

    return {
      stripe_account_id: data.stripe_account_id,
      stripe_charges_enabled: !!data.stripe_charges_enabled,
      stripe_payouts_enabled: !!data.stripe_payouts_enabled,
      stripe_details_submitted: !!data.stripe_details_submitted,
      stripe_onboarding_complete: !!data.stripe_onboarding_complete,
    };
  } catch (err) {
    console.warn('[stripe-connect] Failed to load platform settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function upsertPlatformStripeSettings(
  patch: Partial<PlatformStripeSettings>
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from('platform_settings').upsert({
    id: PLATFORM_SETTINGS_ID,
    ...patch,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function refreshConnectedAccountStatus(
  accountId: string
): Promise<PlatformStripeSettings> {
  const stripe = getPlatformStripeClient();
  if (!stripe) {
    throw new Error('Stripe is not configured for this environment.');
  }

  const account = await stripe.accounts.retrieve(accountId);
  const settings: PlatformStripeSettings = {
    stripe_account_id: account.id,
    stripe_charges_enabled: !!account.charges_enabled,
    stripe_payouts_enabled: !!account.payouts_enabled,
    stripe_details_submitted: !!account.details_submitted,
    stripe_onboarding_complete:
      !!account.charges_enabled &&
      !!account.payouts_enabled &&
      !!account.details_submitted,
  };

  await upsertPlatformStripeSettings(settings);
  return settings;
}

export async function getActiveConnectedAccountId(): Promise<string | null> {
  if (!isStripeConnectEnabled()) return null;

  const settings = await getPlatformStripeSettings();
  if (!settings.stripe_account_id || !settings.stripe_charges_enabled) {
    return null;
  }

  return settings.stripe_account_id;
}

export function stripeAccountRequestOptions(
  connectedAccountId?: string | null
): Stripe.RequestOptions | undefined {
  if (!connectedAccountId) return undefined;
  return { stripeAccount: connectedAccountId };
}

export function resolvePlanKeyFromPriceId(priceId: string): string | null {
  const keys = [
    'MONTHLY',
    'YEARLY',
    'FAMILY_1_MONTHLY',
    'FAMILY_1_YEARLY',
    'FAMILY_2_MONTHLY',
    'FAMILY_2_YEARLY',
    'FAMILY_3_MONTHLY',
    'FAMILY_3_YEARLY',
    'TOPUP_STARTER',
    'TOPUP_STANDARD',
    'TOPUP_PRO',
    'TOPUP_ELITE',
    'TOPUP_ULTIMATE',
    'TOPUP',
  ];

  for (const key of keys) {
    const testId = process.env[`NEXT_PUBLIC_STRIPE_PRICE_${key}_TEST`];
    const liveId =
      process.env[`NEXT_PUBLIC_STRIPE_PRICE_${key}_LIVE`] ||
      process.env[`NEXT_PUBLIC_STRIPE_PRICE_${key}`];
    if (priceId && (priceId === testId || priceId === liveId)) {
      return key;
    }
  }

  return null;
}

export function buildCheckoutPriceData(
  price: Stripe.Price,
  planKey: string | null
): Stripe.Checkout.SessionCreateParams.LineItem.PriceData {
  const label =
    price.nickname ||
    (planKey ? planKey.replace(/_/g, ' ') : 'Membership');

  const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
    currency: price.currency,
    unit_amount: price.unit_amount!,
    product_data: {
      name: label,
    },
  };

  if (price.recurring) {
    priceData.recurring = {
      interval: price.recurring.interval,
      interval_count: price.recurring.interval_count || 1,
    };
  }

  return priceData;
}

export async function ensureExpressConnectedAccount(): Promise<string> {
  const stripe = getPlatformStripeClient();
  if (!stripe) {
    throw new Error('Stripe secret key is missing. Add Stripe keys before enabling Connect.');
  }

  const existing = await getPlatformStripeSettings();
  if (existing.stripe_account_id) {
    return existing.stripe_account_id;
  }

  const account = await stripe.accounts.create({
    type: 'express',
    country: getConnectCountry(),
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'company',
    metadata: {
      platform: process.env.NEXT_PUBLIC_APP_NAME || 'sports-platform',
    },
  });

  await upsertPlatformStripeSettings({
    stripe_account_id: account.id,
    stripe_charges_enabled: !!account.charges_enabled,
    stripe_payouts_enabled: !!account.payouts_enabled,
    stripe_details_submitted: !!account.details_submitted,
    stripe_onboarding_complete: false,
  });

  return account.id;
}

export async function createConnectOnboardingLink(): Promise<string> {
  const stripe = getPlatformStripeClient();
  if (!stripe) {
    throw new Error('Stripe secret key is missing. Add Stripe keys before enabling Connect.');
  }

  const accountId = await ensureExpressConnectedAccount();
  const baseUrl = BASE_URL || 'http://localhost:3000';

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/sys-admin/payments?refresh=true`,
    return_url: `${baseUrl}/sys-admin/payments?connected=true`,
    type: 'account_onboarding',
  });

  return accountLink.url;
}