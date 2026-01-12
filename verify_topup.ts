
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verifyTopUp() {
    console.log("--- VERIFY TOP UP CONFIG ---");

    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("Missing STRIPE_SECRET_KEY");
        return;
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const IDS_TO_CHECK = [
        'price_1SkINl12ap1SCxToSkb1jrWV',
        'price_1SkINl12ap1SCxTodZWHrIQm',
        'price_1SkINl12ap1SCxTolaVPqdzA',
        'price_1SkINl12ap1SCxTotmD50PGA',
        'price_1SkINl12ap1SCxToJvTqg6wj',
        'price_1SkINl12ap1SCxToIyvikBgt'
    ];

    for (const id of IDS_TO_CHECK) {
        try {
            const price = await stripe.prices.retrieve(id);
            const unitAmount = price.unit_amount;
            const currency = price.currency;
            console.log(`ID: ${id} -> Amount: ${unitAmount} ${currency}`);
        } catch (e: any) {
            console.log(`ID: ${id} -> ERROR: ${e.message}`);
        }
    }
}

verifyTopUp();
