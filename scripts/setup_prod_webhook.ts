import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
// Target PRODUCTION URL
const PROD_URL = 'https://east-app-hk.vercel.app/api/webhooks/stripe';

if (!STRIPE_SECRET_KEY) {
    console.error('Please provide STRIPE_SECRET_KEY env var.');
    process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover' as any,
});

async function setupWebhook() {
    console.log(`🚀 Setting up PRODUCTION Webhook for: ${PROD_URL}`);

    try {
        const webhookEndpoint = await stripe.webhookEndpoints.create({
            url: PROD_URL,
            enabled_events: [
                'checkout.session.completed',
                'invoice.payment_succeeded',
                'customer.subscription.deleted',
                'customer.subscription.updated'
            ],
            description: 'Created by Agent for Vercel PRODUCTION'
        });

        console.log(`✅ Webhook Created! ID: ${webhookEndpoint.id}`);
        console.log(`🔑 Webhook Secret: ${webhookEndpoint.secret}`);

        // Output for piping
        console.log(`\nOUTPUT_SECRET=${webhookEndpoint.secret}`);

    } catch (error: any) {
        console.error(`❌ Failed: ${error.message}`);
    }
}

setupWebhook();
