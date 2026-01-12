
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCoaches() {
    console.log("--- Checking Coach Profiles ---");
    const { data: coaches, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'coach');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${coaches.length} coaches.`);
    coaches.forEach(c => {
        console.log(`- ID: ${c.id}`);
        console.log(`  Name: ${c.first_name} ${c.last_name}`);
        console.log(`  Role: ${c.role}`);
        console.log(`  Email: ${c.contact_email}`);
        console.log("---");
    });
}

checkCoaches();
