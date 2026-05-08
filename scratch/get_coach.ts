import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getCoach() {
    const { data, error } = await supabase.from('profiles').select('id').eq('role', 'coach').limit(1);
    if (data && data.length > 0) {
        console.log("COACH_ID:", data[0].id);
    } else {
        console.log("No coach found.");
    }
}
getCoach();
