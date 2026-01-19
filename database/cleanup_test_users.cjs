
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('🔍 Searching for test users with @east.com email...');

    const { data: { users }, error } = await supabase.auth.admin.listUsers({
        perPage: 1000
    });

    if (error) {
        console.error('Failed to list users:', error.message);
        return;
    }

    const testUsers = users.filter(u => u.email && u.email.endsWith('@east.com'));
    console.log(` ditemukan ${testUsers.length} test users.`);

    for (const user of testUsers) {
        process.stdout.write(`🚮 Deleting ${user.email}... `);

        // 1. Delete from profiles first (handles lack of ON DELETE CASCADE)
        await supabase.from('profiles').delete().eq('id', user.id);

        // 2. Delete from auth
        const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
        if (delError) {
            console.log('❌ Failed:', delError.message);
        } else {
            console.log('✅ Deleted');
        }
    }

    console.log('✨ Cleanup complete. Your production list is now clean.');
}

cleanup();
