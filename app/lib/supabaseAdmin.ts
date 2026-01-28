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
