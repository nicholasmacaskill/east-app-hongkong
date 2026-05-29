import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function checkTeams() {
    const { data, error } = await supabase.from('teams').select('*').limit(1);
    console.log("Teams Data:", data);
    console.log("Teams Error:", error);
}

checkTeams();
