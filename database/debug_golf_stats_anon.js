const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debug() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
        throw new Error('Missing credentials');
    }

    // Use ANON key to test what the public/player sees
    const supabase = createClient(supabaseUrl, anonKey);

    console.log('--- Testing with ANON KEY ---');
    const { data: golfStats, error: golfError } = await supabase
        .from('golf_stats')
        .select('*, profiles(*)');

    if (golfError) {
        console.error('Golf Error (Anon):', golfError);
    } else {
        console.log('Golf Stats Content (Anon):', golfStats.length, 'records found');
        if (golfStats.length > 0) {
            console.log('First record profiles:', !!golfStats[0].profiles);
        }
    }
}

debug();
