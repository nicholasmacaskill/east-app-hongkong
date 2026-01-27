import Stripe from 'stripe';

// NOTE: We are reading the key from the environment variable passed to the script execution
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    console.error('Please provide your Stripe Secret Key via STRIPE_SECRET_KEY environment variable.');
    process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover' as any, // Force type match
});

const PRODUCTS = [
    // --- TOP UP (One Time) ---
    { name: 'Top Up Starter', amount: 500, type: 'one_time', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STARTER' },
    { name: 'Top Up Standard', amount: 1000, type: 'one_time', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_TOPUP_STANDARD' },
    { name: 'Top Up Pro', amount: 2500, type: 'one_time', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_TOPUP_PRO' },
    { name: 'Top Up Elite', amount: 5000, type: 'one_time', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ELITE' },
    { name: 'Top Up Ultimate', amount: 10000, type: 'one_time', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_TOPUP_ULTIMATE' },

    // --- MEMBERSHIP (Recurring) ---
    { name: 'PRO Membership (Monthly)', amount: 2000, interval: 'month', type: 'recurring', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_MONTHLY' },
    { name: 'PRO Membership (Yearly)', amount: 24000, interval: 'year', type: 'recurring', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_YEARLY' },

    // --- FAMILY MEMBERSHIP (Recurring) ---
    { name: 'Family (1 Member) Monthly', amount: 2000, interval: 'month', type: 'recurring', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_MONTHLY' },
    { name: 'Family (1 Member) Yearly', amount: 24000, interval: 'year', type: 'recurring', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_YEARLY' },

    { name: 'Family (2 Members) Monthly', amount: 4000, interval: 'month', type: 'recurring', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY' },
    { name: 'Family (2 Members) Yearly', amount: 48000, interval: 'year', type: 'recurring', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY' },

    { name: 'Family (3+ Members) Monthly', amount: 5500, interval: 'month', type: 'recurring', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY' },
    { name: 'Family (3+ Members) Yearly', amount: 66000, interval: 'year', type: 'recurring', id_key: 'NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY' },
];

async function seed() {
    console.log('🚀 Starting Stripe Product Seeding (TEST MODE)...');

    const results: Record<string, string> = {};

    for (const product of PRODUCTS) {
        process.stdout.write(`Creating ${product.name}... `);

        try {
            const priceData: any = {
                unit_amount: product.amount * 100, // Stripe expects cents
                currency: 'hkd',
                product_data: {
                    name: product.name,
                },
            };

            if (product.type === 'recurring') {
                priceData.recurring = { interval: product.interval as any };
            }

            const price = await stripe.prices.create(priceData);

            console.log(`✅ Done! (${price.id})`);
            results[product.id_key] = price.id;

        } catch (error: any) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }

    console.log('\n\n✨ SEEDING COMPLETE! ✨');
    console.log('--- COPY THESE VALUES ONLY INTO YOUR VERCEL "PREVIEW" and "DEVELOPMENT" ENVIRONMENTS ---');
    console.log('(Do not touch the Production/Live values)\n');

    for (const [key, value] of Object.entries(results)) {
        console.log(`${key}=${value}`);
    }
}

seed();
