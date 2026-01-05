import { createClient } from '@supabase/supabase-js';

// Lazy initialization to prevent build-time crashes
let client: ReturnType<typeof createClient> | null = null;

const getSupabase = () => {
    if (client) return client;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // Return a dummy client or throw ONLY when used, not on import
        // For now, we'll throw if actually called to ensure we don't hide runtime errors
        // But throwing here is safer than top-level.
        // Better yet, during build time (if vars missing), we return a dummy or null, 
        // but Typescript expects a client.
        // We'll throw relevant error.

        // Check if we are in a build/node environment where we might just need to pass
        if (typeof window === 'undefined' && (!supabaseUrl || !supabaseKey)) {
            console.warn('⚠️ Supabase Env Vars missing. Client will fail if used.');
        }

        // If we really need keys:
        if (!supabaseUrl) throw new Error('Supabase Url Missing');
        if (!supabaseKey) throw new Error('Supabase Key Missing');
    }

    client = createClient(supabaseUrl!, supabaseKey!);
    return client;
};

// Export a Proxy that initializes on first property access
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
    get: (_target, prop) => {
        const instance = getSupabase();
        return (instance as any)[prop];
    }
});