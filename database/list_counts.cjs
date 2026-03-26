
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllCounts() {
    try {
        console.log(`Checking counts for all known tables in ${supabaseUrl}...`);
        
        const tables = [
            'profiles', 'registrations', 'sessions', 'transactions', 'announcements',
            'messages', 'posts', 'likes', 'availability', 'players_stats',
            'player_relationships', 'coach_services', 'coach_notes', 'notifications',
            'comments', 'booking_logs', 'golf_stats', 'membership_history'
        ];

        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                if (error.code !== 'PGRST116') {
                    // console.log(`- ${table}: Error (${error.message})`);
                }
            } else {
                console.log(`- ${table}: ${count} rows`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

listAllCounts();
