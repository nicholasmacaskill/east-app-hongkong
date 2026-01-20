
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSession() {
    const sessionId = 1046;
    console.log(`\n--- LOOKING FOR SESSION ${sessionId} ---`);
    const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId);

    if (error) console.error(error);
    else if (!data || data.length === 0) console.log(">>> RESULT: SESSION NOT FOUND.");
    else {
        console.log(">>> RESULT: SESSION FOUND!");
        console.table(data);
    }
}

checkSession();
