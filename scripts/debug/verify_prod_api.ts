import { createClient } from '@supabase/supabase-js';
require('dotenv').config({ path: '.env.production' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
    console.log("🚀 Testing Supabase API Write Access...");

    const { data: inserted, error } = await supabase
        .from('webhook_debug_logs')
        .insert({
            event_type: 'MANUAL_API_TEST',
            status: 'VERIFIED',
            payload: { timestamp: new Date().toISOString() }
        })
        .select()
        .single();

    if (error) {
        console.error("❌ API ERROR:", error);
    } else {
        console.log("✅ API Success! Inserted Log ID:", inserted.id);
    }
}

verify();
