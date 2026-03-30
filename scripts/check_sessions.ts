import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUniqueClutterNames() {
    const { data: allSessions } = await supabase.from('sessions').select('title');
    if (!allSessions) return;

    const titles = new Set<string>();
    
    // Log items containing pad or bay or simulator
    allSessions.forEach(s => {
        const lower = s.title.toLowerCase();
        if (lower.includes('bay') || lower.includes('pad') || lower.includes('simulator') || lower.includes('shooting')) {
            titles.add(s.title);
        }
    });

    console.log(Array.from(titles));
}
listUniqueClutterNames();
