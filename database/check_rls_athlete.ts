import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonProfile() {
    console.log("Fetching training_plans with profiles as ANON...");
    const { data: plans, error: planErr } = await supabase
        .from('training_plans')
        .select('*, coach:profiles(first_name, last_name, avatar_url)')
        .limit(5);
        
    console.log("Plans error:", planErr);
    console.log("Plans count:", plans?.length);
    if (plans && plans.length > 0) {
        console.log("Coach info for first plan:", plans[0].coach);
    }
}

testAnonProfile();
