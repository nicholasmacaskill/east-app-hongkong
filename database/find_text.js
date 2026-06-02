const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function findTextInDb() {
    // Let's query all tables and their rows to search for the string
    const tables = ['coach_drills', 'sessions', 'profiles', 'registrations', 'availability', 'messages', 'posts', 'likes', 'players_stats'];
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*');
            if (error) {
                console.error(`Error reading table ${table}:`, error.message);
                continue;
            }
            if (!data) continue;
            
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const str = JSON.stringify(row).toLowerCase();
                if (str.includes('power, speed') || str.includes('conditioning')) {
                    console.log(`Found match in table: ${table}, row index: ${i}`);
                    console.log(JSON.stringify(row, null, 2));
                }
            }
        } catch (err) {
            console.error(`Exception in table ${table}:`, err);
        }
    }
}

findTextInDb();
