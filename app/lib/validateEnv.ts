// Validate required environment variables on startup

const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'NEXT_PUBLIC_STRIPE_PRICE_MONTHLY',
    'NEXT_PUBLIC_STRIPE_PRICE_YEARLY',
    'NEXT_PUBLIC_STRIPE_PRICE_CREDIT',
    'NEXT_PUBLIC_STRIPE_PRICE_TOPUP',
] as const;

export function validateEnvironment(): void {
    const missing: string[] = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(v => console.error(`   - ${v}`));
        throw new Error(`Missing ${missing.length} required environment variable(s)`);
    }

    console.log('✅ All required environment variables are set');
}

// Call this in your app initialization
if (process.env.NODE_ENV === 'production') {
    validateEnvironment();
}
