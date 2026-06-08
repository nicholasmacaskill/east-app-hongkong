import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.production.latest' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
    const { data, error } = await supabase.from('profiles').select('email, first_name, last_name').eq('role', 'coach').limit(5);
    if (error) console.error(error);
    console.log(JSON.stringify(data, null, 2));
}
run();
