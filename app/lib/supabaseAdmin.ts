import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | null = null;

// Admin Client with Service Role Key (Bypasses RLS)
export const getSupabaseAdmin = () => {
    if (supabaseAdmin) return supabaseAdmin;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        throw new Error('❌ Missing SUPABASE_SERVICE_ROLE_KEY. Cannot initialize Admin client.');
    }

    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return supabaseAdmin;
};

// Specialized client for cross-environment sync
export const getSupabaseAdminWithConfig = (url: string, key: string) => {
    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

// Helper to get the "Partner" environment admin client
export const getPartnerSupabaseAdmin = () => {
    const isProd = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('ktlicvv');
    
    // If we are in Prod, partner is Test. If in Test, partner is Prod.
    const partnerUrl = isProd ? process.env.TEST_SUPABASE_URL : process.env.PROD_SUPABASE_URL;
    const partnerKey = isProd ? process.env.TEST_SUPABASE_SERVICE_ROLE_KEY : process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;

    if (!partnerUrl || !partnerKey) {
        console.warn('⚠️ Partner Supabase credentials not found. Sync will be ignored.');
        return null;
    }

    return getSupabaseAdminWithConfig(partnerUrl, partnerKey);
};
