import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debug() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing credentials');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: golfStats, error } = await supabase
        .from('golf_stats')
        .select('*, profiles(*)');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Golf Stats Content:', JSON.stringify(golfStats, null, 2));
    }
}

debug();
