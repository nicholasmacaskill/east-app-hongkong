import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.production.latest' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data } = await supabase.from('profiles').select('email, first_name, last_name').eq('role', 'coach').limit(5);
    console.log(data);
}
run();
