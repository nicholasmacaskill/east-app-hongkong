import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEngineeringTickets() {
    const { data } = await supabase.from('engineering_tickets').select('*');
    if (!data) return;

    const t12 = data.find(t => t.id === 12 || String(t.id) === '12' || t.title.includes('12'));
    if (t12) {
        console.log("FOUND TICKET #12:");
        console.dir(t12, { depth: null });
    } else {
        console.log("TICKET 12 NOT FOUND. LISTING ALL:");
        data.forEach(t => console.log(`${t.id} - ${t.title} - ${t.description}`));
    }
}
checkEngineeringTickets();
