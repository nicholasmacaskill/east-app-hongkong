import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runMigration() {
    console.log('🚀 Starting Coach Schedule Fix Migration...\n');

    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'fix_coach_schedule.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📝 SQL Migration Content:');
        console.log('─'.repeat(60));
        console.log(sql);
        console.log('─'.repeat(60));
        console.log('\n⚠️  MANUAL ACTION REQUIRED:');
        console.log('\n1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the SQL above');
        console.log('4. Click "Run"');
        console.log('\nOR');
        console.log('\nRun this command if you have psql installed:');
        console.log('psql "$DATABASE_URL" -f database/migrations/fix_coach_schedule.sql');

        console.log('\n✅ After running the SQL, your coach schedule should work!');

    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

runMigration();
