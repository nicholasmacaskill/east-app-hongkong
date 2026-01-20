
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');

    envContent.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            const val = values.join('=').trim().replace(/^['"]|['"]$/g, '');
            if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
            if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = val;
        }
    });
} catch (e) { console.error(e); }

if (!supabaseUrl || !supabaseKey) { console.error("Missing credentials"); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function manualBook() {
    const userId = '431d2e1a-3e96-469c-936c-5c6f6080d3ce';
    const sessionId = 1046;
    const targetId = userId; // Booking for self

    console.log(`\n--- ATTEMPTING MANUAL BOOKING ---`);
    console.log(`User: ${userId}`);
    console.log(`Session: ${sessionId}`);

    // 1. Check Credits Before
    const { data: userBefore } = await supabase.from('profiles').select('credits').eq('id', userId).single();
    console.log(`Credits Before: ${userBefore?.credits}`);

    // 2. Call RPC
    console.log("Calling book_session_with_credits...");
    const { data: result, error: rpcError } = await supabase.rpc('book_session_with_credits', {
        p_user_id: userId,
        p_session_id: sessionId,
        p_attendee_id: targetId
    });

    if (rpcError) {
        console.error("RPC ERROR:", rpcError);
    } else {
        console.log("RPC RESULT:", result);
    }

    // 3. Check Credits After
    const { data: userAfter } = await supabase.from('profiles').select('credits').eq('id', userId).single();
    console.log(`Credits After: ${userAfter?.credits}`);

    // 4. Check Registration
    const { data: reg } = await supabase.from('registrations').select('*').eq('user_id', userId).eq('session_id', sessionId);
    console.log("\n--- REGISTRATION RECORD ---");
    console.table(reg);
}

manualBook();
