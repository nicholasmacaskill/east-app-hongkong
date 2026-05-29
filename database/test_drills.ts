import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function testDrills() {
    const { data, error } = await supabase.from('coach_drills').select('*').limit(1);
    console.log("Drills:", data);
    console.log("Error:", error);
}

testDrills();
