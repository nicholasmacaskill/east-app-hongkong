import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// The app uses NEXT_PUBLIC_SUPABASE_URL for the frontend
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function testMessages() {
    console.log("Testing frontend connection to:", url);
    const { data, error } = await supabase.from('messages').select('*, profiles(first_name, last_name, avatar_url)').limit(1);
    console.log("Data:", data);
    console.log("Error:", error);
}

testMessages();
