import Stripe from 'stripe';

// Read from env or allow passing as arg
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const PREVIEW_URL = 'https://east-app-hk-git-main-nicholasmacaskills-projects.vercel.app/api/webhooks/stripe';

if (!STRIPE_SECRET_KEY) {
    console.error('Please provide STRIPE_SECRET_KEY env var.');
    process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover' as any,
});

async function setupWebhook() {
    console.log(`🚀 Setting up Webhook for: ${PREVIEW_URL}`);

    try {
        const webhookEndpoint = await stripe.webhookEndpoints.create({
            url: PREVIEW_URL,
            enabled_events: [
                'checkout.session.completed',
                'invoice.payment_succeeded',
                'customer.subscription.deleted',
                'customer.subscription.updated'
            ],
            description: 'Created by Agent for Vercel Preview'
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
