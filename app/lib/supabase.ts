import { createClient } from '@supabase/supabase-js';

// ⚠️ TEMPORARY: Hardcoding local keys to force connection
// These come from your terminal output earlier
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('[SUPABASE INIT] URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('[SUPABASE INIT] URL VALUE (partial):', supabaseUrl?.substring(0, 8) + '...'); // Check protocol
console.log('[SUPABASE INIT] KEY:', supabaseKey ? 'Found' : 'Missing');

let client;
try {
    client = createClient(supabaseUrl, supabaseKey);
} catch (e: any) {
    console.error('❌ Supabase Client Init Failed:', e.message);
    throw e;
}

export const supabase = client;