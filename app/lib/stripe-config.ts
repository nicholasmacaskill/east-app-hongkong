
/**
 * Stripe Configuration Manager
 * Handles dynamic switching between Test and Live modes.
 */

export type StripeMode = 'test' | 'live';

/**
 * Resolves the current Stripe mode based on:
 * 1. NEXT_PUBLIC_STRIPE_MODE override
 * 2. Hostname context (test on vercel.app or localhost)
 * 3. Fallback to NODE_ENV
 */
export function getStripeMode(): StripeMode {
  // 1. Check for manual override
  const override = process.env.NEXT_PUBLIC_STRIPE_MODE;
  if (override === 'test' || override === 'live') {
    return override;
  }

  // 2. Check environment
  if (process.env.NODE_ENV === 'development') {
    return 'test';
  }

  // 3. Fallback to live if in production, but let's be safe and check for vercel previews
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    if (hostname.includes('vercel.app') || hostname === 'localhost' || port === '3001') {
      return 'test';
    }
  }

  // 4. Default to live in production
  return 'live';
}

export function getStripeSecretKey(): string {
  const mode = getStripeMode();
  const key = mode === 'live' 
    ? process.env.STRIPE_SECRET_KEY_LIVE 
    : (process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY);
  
  if (!key) {
    console.error(`CRITICAL: Stripe Secret Key missing for ${mode} mode.`);
  }
  return key || '';
}

export function getStripePublishableKey(): string {
  const mode = getStripeMode();
  const key = mode === 'live'
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE
    : (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  return key || '';
}

export function getStripeWebhookSecret(): string {
  const mode = getStripeMode();
  const key = mode === 'live'
    ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
    : (process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET);

  return key || '';
}

export function getStripePriceId(key: string): string {
  const mode = getStripeMode();
  
  // Client-side Next.js requires explicit property access for NEXT_PUBLIC_ variables
  // Dynamic indexing process.env[string] only works on the server
  const testPrices: Record<string, string | undefined> = {
    'MONTHLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_TEST,
    'YEARLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY_TEST,
    'STARTER': process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_TEST,
    'STANDARD': process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_TEST,
    'PRO': process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_TEST,
    'ELITE': process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_TEST,
    'ULTIMATE': process.env.NEXT_PUBLIC_STRIPE_PRICE_ULTIMATE_TEST,
    'FAMILY_1_MONTHLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_TEST, // Fallback to individual
    'FAMILY_1_YEARLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY_TEST,   // Fallback to individual
    'FAMILY_2_MONTHLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY_TEST,
    'FAMILY_2_YEARLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY_TEST,
    'FAMILY_3_MONTHLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY_TEST,
    'FAMILY_3_YEARLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY_TEST,
  };

  const livePrices: Record<string, string | undefined> = {
    'MONTHLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_LIVE,
    'YEARLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY_LIVE,
    'FAMILY_2_MONTHLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY_LIVE,
    'FAMILY_2_YEARLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY_LIVE,
    'FAMILY_3_MONTHLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY_LIVE,
    'FAMILY_3_YEARLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY_LIVE,
  };

  const priceId = mode === 'test' ? testPrices[key.toUpperCase()] : livePrices[key.toUpperCase()];
  
  if (!priceId) {
    console.warn(`⚠️ Stripe Price ID missing for ${key} in ${mode} mode.`);
  }
  
  return priceId || '';
}
