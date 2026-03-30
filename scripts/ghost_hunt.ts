import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function findGhostBookings() {
    console.log("Analyzing 9 live registrations to see who currently holds a booking...");
    const { data: reg, error } = await supabase
        .from('registrations')
        .select(`
            id,
            user_id,
            session_id,
            credits_paid,
            profiles:user_id (id, first_name, last_name, credits),
            sessions:session_id (id, title, credit_cost)
        `);

    if (error) console.error(error);
    
    // Log existing bookings
    console.log("=== CURRENT ACTIVE BOOKINGS ===");
    for (const r of reg) {
        const p = r.profiles;
        const s = r.sessions;
        const name = `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || 'Unknown';
        console.log(`- ${name} (Bal: ${p?.credits}) is booked for: ${s?.title} (Cost: ${r.credits_paid || s?.credit_cost})`);
    }

    console.log("\n=== CREDIT ANOMALY GHOST HUNT ===");
    // Now let's fetch anomalies again
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, credits')
        .gt('credits', 0);
        
    for (const p of profiles) {
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.id;
        
        // Find how many credits this person has currently tied up in active registrations
        let totalCurrentBookingCost = 0;
        for (const r of reg) {
            if (r.user_id === p.id) {
                totalCurrentBookingCost += (r.credits_paid || r.sessions?.credit_cost || 0);
            }
        }
        
        // If they have 900 credits, they've spent 100. If totalCurrentBookingCost is 0, where did the 100 go? Ghost Delete!
        // We know standard tiers are 500, 1000, 2500, 5000, 10000, 15000, etc.
        // Let's assume their "starting" balance was the next highest thousand or 500
        let assumedStart = Math.ceil((p.credits + totalCurrentBookingCost) / 500) * 500;
        if (assumedStart === 0) assumedStart = 500;
        
        const unaccountedMissing = assumedStart - (p.credits + totalCurrentBookingCost);
        
        if (unaccountedMissing > 0 && unaccountedMissing % 100 === 0) {
            console.log(`👻 GHOST DETECTED: ${name} currently has ${p.credits} credits, plus ${totalCurrentBookingCost} tied up in active bookings.`);
            console.log(`    -> They are missing exactly ${unaccountedMissing} credits. They likely booked ${unaccountedMissing/100} Shooting Pad sessions.`);
        }
    }
}

findGhostBookings();
