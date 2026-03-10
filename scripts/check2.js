const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) { console.error('Missing env vars'); process.exit(1); }

const supabase = createClient(supabaseUrl, serviceKey);

async function checkSchema() {
    console.log('🔍 Checking for actually missing tables...');

    const checks = [
        'leaderboard',
        'news',
        'player_stats',
        'stats_metadata',
        'teams',
        'rosters',
        'family_connections'
    ];

    for (let table of checks) {
        let { error } = await supabase.from(table).select('*').limit(1);
        if (error && error.code === '42P01') {
            console.log('❌ MISSING Table:', table);
        } else if (error) {
            console.log('⚠️ ERROR ' + table + ':', error.message);
        } else {
            console.log('✅ EXISTS Table:', table);
        }
    }
}
checkSchema();
