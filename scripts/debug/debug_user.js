
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
} catch (e) {
    console.error(e);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectUser() {
    const userId = '431d2e1a-3e96-469c-936c-5c6f6080d3ce'; // From log

    console.log(`\n--- INSPECTING USER: ${userId} ---`);
    const { data: user, error: userErr } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (userErr) { console.error("User Error:", userErr); }
    else {
        console.log(`Name: ${user.first_name} ${user.last_name}`);
        console.log(`Credits: ${user.credits}`);
        console.log(`Role: ${user.role}`);
    }

    console.log("\n--- COUNTING REGISTRATIONS ---");
    const { count, error: countErr } = await supabase.from('registrations').select('*', { count: 'exact', head: true });
    console.log(`Total Registrations in DB: ${count}`);
    if (countErr) console.error(countErr);

    console.log("\n--- DUMPING ALL REGISTRATIONS ---");
    const { data: allRegs, error: dumpErr } = await supabase.from('registrations').select('*');
    console.table(allRegs);

    console.log("\n--- REGISTRATIONS FOR THIS USER ---");
    const { data: regs, error: regErr } = await supabase.from('registrations').select('id, session_id, created_at, credits_paid').eq('user_id', userId);
    console.table(regs);
}

inspectUser();
