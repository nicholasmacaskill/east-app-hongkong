import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function globalTeardown() {
    console.log('\n🧹 Starting Global Test Data Cleanup...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (listError) throw listError;

        const keywords = ['test', 'qa', 'reminder'];
        const protectedEmails = ['admin@east.com', 'rick@dynevents.com', 'nicholasmacaskill@proton.me'];

        const usersToDelete = users.filter(user => {
            const email = (user.email || '').toLowerCase();
            const isProtected = protectedEmails.includes(email);
            const matchesMatch = keywords.some(k => email.includes(k));
            return matchesMatch && !isProtected;
        });

        console.log(`Found ${usersToDelete.length} test accounts to delete.`);

        const ids = usersToDelete.map(u => u.id);
        if (ids.length > 0) {
            // Clear dependencies first
            await Promise.all([
                supabase.from('admin_audit_logs').delete().in('admin_id', ids),
                supabase.from('announcements').delete().in('created_by', ids),
                supabase.from('likes').delete().in('user_id', ids),
                supabase.from('posts').delete().in('user_id', ids),
                supabase.from('players_stats').update({ verified_by: null }).in('verified_by', ids),
                supabase.from('transactions').delete().in('user_id', ids),
            ]);
            
            await supabase.from('profiles').delete().in('id', ids);

            for (const user of usersToDelete) {
                console.log(`Deleting: ${user.email}`);
                const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
                if (deleteError) {
                    console.error(`❌ Failed to delete auth user ${user.id}:`, deleteError.message);
                }
            }
        }

        console.log('✨ Cleanup complete.\n');
    } catch (error) {
        console.error('❌ Global Teardown Error:', error);
    }
}

export default globalTeardown;
