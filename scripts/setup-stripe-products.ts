import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

async function setupJrDucksStripe(secretKey: string) {
  console.log('🦆 Setting up Anaheim Jr. Ducks Stripe Products in Sandbox (USD)...');
  const stripe = new Stripe(secretKey);

  // Verify connection & account
  const account = await stripe.accounts.retrieve();
  console.log(`Connected to Stripe Account: ${account.business_profile?.name || account.id} (Country: ${account.country})`);

  // 1. Membership Subscriptions
  console.log('\nCreating Membership Subscription Products...');
  
  // Individual
  const indProd = await stripe.products.create({
    name: 'Anaheim Jr. Ducks - Individual Membership',
    description: 'Full access to training schedules, drill hub, and facilities for 1 player.',
    metadata: { tenant: 'jrducks', tier: 'individual' }
  });
  const indMonthly = await stripe.prices.create({
    product: indProd.id,
    unit_amount: 9900, // $99.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'individual', credits: '1000' }
  });
  const indYearly = await stripe.prices.create({
    product: indProd.id,
    unit_amount: 99000, // $990.00
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { tier: 'individual', credits: '15000' }
  });

  // Family 2
  const fam2Prod = await stripe.products.create({
    name: 'Anaheim Jr. Ducks - Family Membership (2 Players)',
    description: 'Shared family membership for 2 players with discounted credit pooling.',
    metadata: { tenant: 'jrducks', tier: 'family_2' }
  });
  const fam2Monthly = await stripe.prices.create({
    product: fam2Prod.id,
    unit_amount: 17900, // $179.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'family_2', credits: '2500' }
  });
  const fam2Yearly = await stripe.prices.create({
    product: fam2Prod.id,
    unit_amount: 179000, // $1790.00
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { tier: 'family_2', credits: '33000' }
  });

  // Family 3+
  const fam3Prod = await stripe.products.create({
    name: 'Anaheim Jr. Ducks - Family Membership (3+ Players)',
    description: 'Ultimate family plan with unrestricted access for 3 or more athletes.',
    metadata: { tenant: 'jrducks', tier: 'family_3plus' }
  });
  const fam3Monthly = await stripe.prices.create({
    product: fam3Prod.id,
    unit_amount: 24900, // $249.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'family_3plus', credits: '3500' }
  });
  const fam3Yearly = await stripe.prices.create({
    product: fam3Prod.id,
    unit_amount: 249000, // $2490.00
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { tier: 'family_3plus', credits: '45000' }
  });

  // 2. Credit Top-Up Packs (One-time)
  console.log('\nCreating Credit Top-Up Packages...');
  
  const createTopup = async (name: string, credits: number, amountCents: number) => {
    const prod = await stripe.products.create({
      name: `Anaheim Jr. Ducks - ${name} (${credits} Credits)`,
      description: `Instant wallet top-up of ${credits} credits for session bookings.`,
      metadata: { tenant: 'jrducks', credits: credits.toString(), type: 'topup' }
    });
    return stripe.prices.create({
      product: prod.id,
      unit_amount: amountCents,
      currency: 'usd',
      metadata: { credits: credits.toString() }
    });
  };

  const starterPrice = await createTopup('Starter Pack', 50, 5000);     // $50
  const standardPrice = await createTopup('Standard Pack', 100, 9500);  // $95
  const proPrice = await createTopup('Pro Pack', 250, 22500);           // $225
  const elitePrice = await createTopup('Elite Pack', 500, 42500);       // $425
  const ultimatePrice = await createTopup('Ultimate Pack', 1000, 80000);// $800

  const envOutput = `
# ==============================================================================
# ANAHEIM JR. DUCKS — STRIPE CONFIGURATION (USD SANDBOX)
# Account: ${account.business_profile?.name || account.id}
# ==============================================================================
NEXT_PUBLIC_STRIPE_MODE="test"
STRIPE_SECRET_KEY="${secretKey}"
STRIPE_SECRET_KEY_TEST="${secretKey}"

# Membership Subscription Price IDs (USD)
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY="${indMonthly.id}"
NEXT_PUBLIC_STRIPE_PRICE_YEARLY="${indYearly.id}"
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_TEST="${indMonthly.id}"
NEXT_PUBLIC_STRIPE_PRICE_YEARLY_TEST="${indYearly.id}"

NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_MONTHLY="${indMonthly.id}"
NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_YEARLY="${indYearly.id}"

NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY="${fam2Monthly.id}"
NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY="${fam2Yearly.id}"
NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY_TEST="${fam2Monthly.id}"
NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY_TEST="${fam2Yearly.id}"

NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY="${fam3Monthly.id}"
NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY="${fam3Yearly.id}"
NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY_TEST="${fam3Monthly.id}"
NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY_TEST="${fam3Yearly.id}"

# Credit Top-Up Pack Price IDs (USD)
NEXT_PUBLIC_STRIPE_PRICE_TOPUP="${starterPrice.id}"
NEXT_PUBLIC_STRIPE_PRICE_TOPUP_TEST="${starterPrice.id}"
NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STARTER="${starterPrice.id}"
NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STARTER_TEST="${starterPrice.id}"
NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STANDARD="${standardPrice.id}"
NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STANDARD_TEST="${standardPrice.id}"
NEXT_PUBLIC_STRIPE_PRICE_TOPUP_PRO="${proPrice.id}"
NEXT_PUBLIC_STRIPE_PRICE_TOPUP_PRO_TEST="${proPrice.id}"
NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ELITE="${elitePrice.id}"
NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ELITE_TEST="${elitePrice.id}"
NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ULTIMATE="${ultimatePrice.id}"
NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ULTIMATE_TEST="${ultimatePrice.id}"
`;

  console.log('\n✅ All Products & Prices Created Successfully!');
  console.log(envOutput);

  // Append to .env.jrducks.example
  const targetEnv = path.resolve(process.cwd(), '.env.jrducks.example');
  fs.appendFileSync(targetEnv, envOutput);
  console.log(`Updated ${targetEnv} with newly generated Stripe IDs.`);
}

const key = process.argv[2] || process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Usage: npx tsx scripts/setup-stripe-products.ts <sk_test_...>');
  process.exit(1);
}

setupJrDucksStripe(key).catch(err => {
  console.error('Error setting up Stripe products:', err);
  process.exit(1);
});
