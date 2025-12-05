import { createClient } from '@supabase/supabase-js';

// ⚠️ TEMPORARY: Hardcoding local keys to force connection
// These come from your terminal output earlier
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; // This is the "anon" key from your terminal output

export const supabase = createClient(supabaseUrl, supabaseKey);