import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function globalTeardown() {
    console.log('\n🧹 Starting Global Test Data Cleanup...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 1. Fetch all users
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        // 2. Define patterns for deletion
        const testPatterns = [
            /@pw\.test$/,
            /@example\.com$/,
            /^admin-update-.*@east\.com$/,
            /^player-to-edit-.*@east\.com$/,
            /^immediate-login-.*@east\.com$/,
            /^test-user-.*@example\.com$/
        ];

        const usersToDelete = users.filter(user => {
            const email = user.email?.toLowerCase() || '';
            return testPatterns.some(pattern => pattern.test(email));
        });

        console.log(`Found ${usersToDelete.length} test accounts to delete.`);

        // 3. Delete users (Cascades to profiles if configured, but we'll be thorough)
        for (const user of usersToDelete) {
            console.log(`Deleting: ${user.email}`);

            // Delete from profiles first to be safe with FKs
            await supabase.from('profiles').delete().eq('id', user.id);

            // Delete from auth
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
            if (deleteError) {
                console.error(`❌ Failed to delete auth user ${user.id}:`, deleteError.message);
            }
        }

        console.log('✨ Cleanup complete.\n');
    } catch (error) {
        console.error('❌ Global Teardown Error:', error);
    }
}

export default globalTeardown;
