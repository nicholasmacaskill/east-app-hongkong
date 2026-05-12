import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCoaches() {
    console.log('--- FETCHING ACTIVE COACHES VIA SUPABASE CLIENT ---');
    
    // 1. Get all profiles with coach role
    const { data: coaches, error: pError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role')
        .eq('role', 'coach');

    if (pError) {
        console.error('Error fetching profiles:', pError.message);
        return;
    }

    if (!coaches || coaches.length === 0) {
        console.log('No coaches found in profiles table.');
        return;
    }

    // 2. For each coach, check how many drills they have
    const coachList = [];
    for (const coach of coaches) {
        const { count, error: dError } = await supabase
            .from('coach_drills')
            .select('*', { count: 'exact', head: true })
            .eq('coach_id', coach.id);

        coachList.push({
            ...coach,
            drill_count: count || 0
        });
    }

    // Sort by drill count to find the one you were just using
    coachList.sort((a, b) => b.drill_count - a.drill_count);
    
    console.table(coachList);
}

debugCoaches();
