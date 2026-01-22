const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

console.log("\n🔍 Starting Pre-Live Production Audit...");
console.log("========================================");

let exitCode = 0;

function check(label, value, validator, suggestion) {
    const isValid = validator(value);
    if (isValid) {
        console.log(`✅ ${label}: Passed`);
    } else {
        console.error(`❌ ${label}: FAILED`);
        console.error(`   Value: "${value || 'MISSING'}"`);
        console.error(`   Suggestion: ${suggestion}`);
        exitCode = 1;
    }
}

// 1. BASE URL
check(
    "NEXT_PUBLIC_BASE_URL",
    process.env.NEXT_PUBLIC_BASE_URL,
    (v) => v && v.startsWith('https://') && !v.includes('localhost'),
    "Must start with https:// and NOT be localhost. Current: " + process.env.NEXT_PUBLIC_BASE_URL
);

// 2. STRIPE KEYS (If in Production context)
const isLiveKeysExpected = process.argv.includes('--live');

if (isLiveKeysExpected) {
    check(
        "STRIPE_SECRET_KEY (LIVE)",
        process.env.STRIPE_SECRET_KEY,
        (v) => v && v.startsWith('sk_live_'),
        "Live mode requested but key starts with sk_test_ or is missing."
    );
    check(
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (LIVE)",
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        (v) => v && v.startsWith('pk_live_'),
        "Live mode requested but key starts with pk_test_ or is missing."
    );
} else {
    console.log("⚠️  Skipping LIVE key check (Run with --live to enforce pk_live/sk_live prefixes).");
}

// 3. STRIPE WEBHOOK SECRET
check(
    "STRIPE_WEBHOOK_SECRET",
    process.env.STRIPE_WEBHOOK_SECRET,
    (v) => v && v.startsWith('whsec_'),
    "Webhook secret must start with 'whsec_'. Checkout Stripe Dashboard > Webhooks."
);

// 4. PRICE ID FORMAT
const priceVars = [
    'NEXT_PUBLIC_STRIPE_PRICE_MONTHLY',
    'NEXT_PUBLIC_STRIPE_PRICE_YEARLY',
    'NEXT_PUBLIC_STRIPE_PRICE_CREDIT',
    'NEXT_PUBLIC_STRIPE_PRICE_TOPUP'
];

priceVars.forEach(v => {
    check(
        v,
        process.env[v],
        (val) => val && val.startsWith('price_'),
        "Price IDs typically start with 'price_'. Ensure these are copied from the LIVE Stripe products."
    );
});

// 5. SUPABASE AUTH
check(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    (v) => v && v.length > 50,
    "Service role key looks too short or is missing. Required for bypassing RLS in webhooks."
);

console.log("========================================");
if (exitCode === 0) {
    console.log("🚀 AUDIT COMPLETE: Environment looks healthy for production.");
} else {
    console.error("⛔ AUDIT FAILED: Please fix the errors above before deploying to production.");
}

process.exit(exitCode);
