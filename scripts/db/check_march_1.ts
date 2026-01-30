
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDate() {
    const targetDate = '2026-03-01';
    console.log(`🔍 Checking sessions on ${targetDate}...`);

    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, title, category, start_time, session_type_id')
        .gte('start_time', `${targetDate}T00:00:00Z`)
        .lte('start_time', `${targetDate}T23:59:59Z`)
        .ilike('title', '%North Bay%');

    if (error) {
        console.error(error);
    } else {
        console.log(JSON.stringify(sessions, null, 2));
    }
}

checkDate();
