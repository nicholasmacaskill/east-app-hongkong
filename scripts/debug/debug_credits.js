
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
            const val = values.join('=').trim().replace(/^['"]|['"]$/g, ''); // Remote quotes
            if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
            if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = val;
        }
    });
} catch (e) {
    console.error("Error reading .env.local", e.message);
}

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in .env.local");
    console.log("URL:", supabaseUrl ? "Found" : "Missing");
    console.log("KEY:", supabaseKey ? "Found" : "Missing");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCredits() {
    console.log("--- CHECKING RECENT REGISTRATIONS (Last 10) ---");
    const { data: regs, error: regError } = await supabase
        .from('registrations')
        .select(`
      id, 
      created_at, 
      credits_paid, 
      payer_id,
      session_id,
      sessions ( title, credit_cost ),
      payer:payer_id ( contact_email, credits, first_name )
    `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (regError) {
        console.error("Error fetching registrations:", regError);
    } else {
        if (!regs || regs.length === 0) {
            console.log("No registrations found.");
        } else {
            regs.forEach(r => {
                console.log(`\nBooking ID: ${r.id} | Time: ${new Date(r.created_at).toLocaleString()}`);
                console.log(`User: ${r.payer?.first_name} (${r.payer?.contact_email})`);
                console.log(`Session: ${r.sessions?.title} | Defined Cost: ${r.sessions?.credit_cost}`);
                console.log(`Credits Paid (in Reg): ${r.credits_paid}`);
                console.log(`Current Balance: ${r.payer?.credits}`);

                if (r.credits_paid === 0) console.warn(">>> WARN: Paid 0 credits!");
                if (r.credits_paid !== r.sessions?.credit_cost) console.warn(">>> WARN: Mismatch between Data Cost and Paid Amount!");
            });
        }
    }

    console.log("\n--- CHECKING SESSION COSTS (Sample) ---");
    const { data: sessions } = await supabase.from('sessions').select('id, title, credit_cost').limit(5);
    console.table(sessions);
}

checkCredits();
