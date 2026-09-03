import { SupabaseClient } from '@supabase/supabase-js';

const PROTECTED_EMAILS = [
    'admin@east.com',
    'rick@dynevents.com',
    'nicholasmacaskill@proton.me'
];

const TEST_KEYWORDS = ['test', 'qa', 'pw.test', 'east.internal'];

/**
 * Hardened Cascading Database & Auth Purge Utility.
 * Resolves FK constraints in reverse-dependency order.
 */
export async function purgeUserData(supabase: SupabaseClient, userIds: string[]) {
    if (!userIds || userIds.length === 0) return;

    try {
        // 1. Relational Junctions & Dependent Child Tables
        await Promise.allSettled([
            supabase.from('player_relationships').delete().or(`parent_id.in.(${userIds.join(',')}),child_id.in.(${userIds.join(',')})`),
            supabase.from('registrations').delete().in('user_id', userIds),
            supabase.from('transactions').delete().in('user_id', userIds),
            supabase.from('likes').delete().in('user_id', userIds),
            supabase.from('posts').delete().in('user_id', userIds),
            supabase.from('announcements').delete().in('created_by', userIds),
            supabase.from('admin_audit_logs').delete().in('admin_id', userIds),
            supabase.from('players_stats').update({ verified_by: null }).in('verified_by', userIds),
            supabase.from('players_stats').delete().in('player_id', userIds),
            supabase.from('notifications').delete().in('user_id', userIds)
        ]);

        // 2. Profiles Table
        await supabase.from('profiles').delete().in('id', userIds);

        // 3. Supabase Auth Users
        for (const id of userIds) {
            await supabase.auth.admin.deleteUser(id).catch(() => null);
        }
    } catch (err: any) {
        console.warn('⚠️ [DB CLEANUP] Notice during cascade cleanup:', err.message || err);
    }
}

/**
 * Scans Supabase Auth for orphaned test accounts and cleans them up.
 */
export async function scanAndPurgeTestAccounts(supabase: SupabaseClient) {
    try {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (listError || !users) return;

        const usersToDelete = users.filter(user => {
            const email = (user.email || '').toLowerCase();
            const isProtected = PROTECTED_EMAILS.includes(email);
            const matchesTest = TEST_KEYWORDS.some(k => email.includes(k));
            return matchesTest && !isProtected;
        });

        if (usersToDelete.length > 0) {
            console.log(`🧹 Purging ${usersToDelete.length} test accounts...`);
            const ids = usersToDelete.map(u => u.id);
            await purgeUserData(supabase, ids);
            console.log(`✅ Successfully purged ${usersToDelete.length} accounts.`);
        } else {
            console.log('✅ No orphaned test accounts found.');
        }
    } catch (err: any) {
        console.warn('⚠️ [DB CLEANUP] Error during scan and purge:', err.message || err);
    }
}
