import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// POINTING EXPLICITLY TO THE BACKED-UP LIVE PRODUCTION KEYS
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function scanLive() {
    console.log("=== EXECUTING DEEP SCAN ON LIVE PRODUCTION DATABASE ===");

    // 1. Check exact registrations count
    const { count: regCount } = await supabase.from('registrations').select('*', { count: 'exact', head: true });
    console.log(`Live Bookings (Registrations Table Count): ${regCount}`);

    // 2. Fetch active profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, contact_email, role, credits, membership_tier')
        .order('credits', { ascending: false });

    console.log(`\nLive Profiles Found: ${profiles?.length || 0}`);
    console.log("------------------------------------------------------------------");
    console.log("NAME/EMAIL                         | ROLE       | TIER  | CREDITS ");
    console.log("------------------------------------------------------------------");

    let likelySpentCreditsCount = 0;

    if (profiles) {
        for (const p of profiles) {
            const name = (p.first_name || p.last_name) ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : (p.contact_email || p.id).substring(0, 30);
            const role = (p.role || 'none').padEnd(10);
            const tier = (p.membership_tier || 'none').padEnd(5).substring(0, 5);
            const credits = (p.credits ?? 0).toString().padStart(7);
            
            console.log(`${name.padEnd(34).substring(0, 34)} | ${role} | ${tier} | ${credits}`);

            if (p.credits && p.credits > 0 && p.credits % 100 !== 0) {
                 likelySpentCreditsCount++;
            }
        }
    }
}

scanLive();
