import { createClient } from '@supabase/supabase-js';

// Admin Client with Service Role Key (Bypasses RLS)
export const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        throw new Error('❌ Missing SUPABASE_SERVICE_ROLE_KEY. Cannot initialize Admin client.');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
