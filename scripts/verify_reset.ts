import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function verifyReset() {
    const supabase = getSupabaseAdmin();
    const ADMIN_EMAIL = 'admin@east.com';

    console.log('🔍 Verifying System Reset...');

    // 1. Check Profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) console.error('Profiles Check Error:', pError);
    else {
        console.log(`\n👤 Profiles Remaining: ${profiles.length}`);
        profiles.forEach(p => console.log(`   - ${p.first_name} ${p.last_name} (${p.role}) - ${p.contact_email}`));
    }

    // 2. Check Auth Users
    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
    if (uError) console.error('Auth Check Error:', uError);
    else {
        console.log(`\n🔐 Auth Users Remaining: ${users.length}`);
        users.forEach(u => console.log(`   - ${u.email} (${u.id})`));
    }

    // 3. Check Data Tables
    const tables = ['registrations', 'sessions', 'announcements', 'players_stats'];
    console.log('\n📊 Checking Data Tables:');
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) console.log(`   - ${table}: Error (${error.message})`);
        else console.log(`   - ${table}: ${count} rows`);
    }
}

verifyReset().catch(console.error);
