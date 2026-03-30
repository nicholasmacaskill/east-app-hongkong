import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCredits() {
    console.log("Scanning live profiles for credit anomalies...");
    
    // Fetch all users
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, contact_email, role, credits, membership_tier')
        .order('credits', { ascending: false });

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log(`\nFound ${profiles.length} profiles. Here are their balances:`);
    console.log("------------------------------------------------------------------");
    console.log("NAME/EMAIL                         | ROLE       | TIER  | CREDITS ");
    console.log("------------------------------------------------------------------");

    let possibleBookers = 0;

    for (const p of profiles) {
        const name = (p.first_name || p.last_name) ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : (p.contact_email || p.id).substring(0, 30);
        const role = (p.role || 'none').padEnd(10);
        const tier = (p.membership_tier || 'none').padEnd(5).substring(0, 5);
        const credits = (p.credits ?? 0).toString().padStart(7);
        
        console.log(`${name.padEnd(34).substring(0, 34)} | ${role} | ${tier} | ${credits}`);

        // If credits aren't perfectly round hundreds or flat numbers that indicate pure purchase
        // e.g., if a user has <1000 credits, they likely spent them.
        if (p.credits > 0 && p.credits % 500 !== 0) {
            possibleBookers++;
        }
    }
    
    console.log("------------------------------------------------------------------");
    console.log(`There are ${possibleBookers} users whose credit balances do not evenly match standard top-up increments (meaning they likely spent credits).`);
}

checkCredits();
