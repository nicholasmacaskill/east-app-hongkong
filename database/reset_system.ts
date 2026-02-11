import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function resetSystem() {
    const supabase = getSupabaseAdmin();
    const ADMIN_EMAIL = 'admin@east.com';

    console.log(`🚀 Starting Full System Reset (Keeping ${ADMIN_EMAIL})...`);

    // 1. Get Admin User ID(s)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authError) throw authError;

    const adminUsers = users.filter(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (adminUsers.length === 0) {
        console.error(`❌ Critical Error: Could not find admin user ${ADMIN_EMAIL}`);
        console.log('Available emails:', users.map(u => u.email).slice(0, 10));
        return;
    }

    const adminIds = adminUsers.map(u => u.id);
    console.log(`✅ Identified Admin ID(s): ${adminIds.join(', ')}`);

    // 2. Define tables to clear (ordered by dependency)
    const tablesToClear = [
        'registrations',
        'players_stats',
        'player_relationships',
        'availability',
        'voice_commands',
        'likes',
        'messages',
        'posts',
        'coach_services',
        'sessions',
        'session_types',
        'announcements',
        'admin_audit_logs',
        'coach_notes',
        'golf_stats',
        'leaderboard_entries',
        'test_emails',
        'transactions',
        'webhook_debug_logs'
    ];

    console.log('\n🧹 Clearing data tables...');
    const supabaseAny = supabase as any;
    for (const table of tablesToClear) {
        // We use .neq('id' as any, '00000000-0000-0000-0000-000000000000') as a trick to "delete all" 
        // without providing a filter that would block the delete.
        // Or we can just use .filter('id', 'not.is', 'null') if they have numeric IDs or something similar.
        // Most of these tables use bigint IDs or UUIDs.

        console.log(`   - Clearing ${table}...`);
        const { error } = await supabaseAny.from(table).delete().not('id', 'is', null);

        if (error) {
            console.warn(`   ⚠️  Note: Could not clear ${table} (it might be empty or missing 'id' column): ${error.message}`);
            // Fallback for tables without 'id' column or different PK
            if (table === 'registrations') {
                await supabaseAny.from(table).delete().not('user_id', 'is', null);
            } else if (table === 'players_stats') {
                await supabaseAny.from(table).delete().not('player_id', 'is', null);
            } else if (table === 'player_relationships') {
                await supabaseAny.from(table).delete().not('parent_id', 'is', null);
            } else if (table === 'coach_services') {
                await supabaseAny.from(table).delete().not('coach_id', 'is', null);
            } else if (table === 'admin_audit_logs') {
                await supabaseAny.from(table).delete().not('admin_id', 'is', null);
            } else if (table === 'transactions') {
                await supabaseAny.from(table).delete().not('profile_id', 'is', null);
            }
        }
    }

    // 2.5 Clear Storage Objects
    console.log('\n📦 Clearing storage objects...');
    const { error: storageError } = await supabaseAny.schema('storage').from('objects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (storageError) {
        console.warn('   ⚠️  Could not clear storage objects:', storageError.message);
    } else {
        console.log('✅ Storage objects cleared.');
    }

    // 3. Delete Profiles (except admin)
    console.log('\n👤 Cleaning up profiles...');
    const { error: profileError } = await supabaseAny
        .from('profiles')
        .delete()
        .filter('id', 'not.in', `(${adminIds.join(',')})`);

    if (profileError) {
        console.error('❌ Failed to cleanup profiles:', profileError.message);
    } else {
        console.log('✅ Profiles cleared (except admin).');
    }

    // 4. Delete Auth Users (except admin)
    console.log('\n🔐 Cleaning up auth users...');
    const adminIdSet = new Set(adminIds);
    const usersToDelete = users.filter(u => !adminIdSet.has(u.id));
    console.log(`   - Found ${usersToDelete.length} users to delete.`);

    for (const user of usersToDelete) {
        const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
        if (delError) {
            console.error(`   ❌ Failed to delete auth user ${user.id} (${user.email}):`, delError.message);
        } else {
            process.stdout.write('.');
        }
    }
    console.log('\n✅ Auth users cleared.');

    console.log('\n✨ System Reset Complete.');
    console.log('-----------------------------------');
    console.log(`Pristine state achieved. Admin account ${ADMIN_EMAIL} remains active.`);
}

resetSystem().catch(err => {
    console.error('Fatal Reset Error:', err);
});
