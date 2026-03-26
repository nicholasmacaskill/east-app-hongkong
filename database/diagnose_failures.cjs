
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseFailures() {
    try {
        let allUsers = [];
        let page = 1;
        const perPage = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ page, perPage });
            if (listError) throw listError;
            allUsers.push(...users);
            if (users.length < perPage) hasMore = false;
            else page++;
        }

        const internalDomains = ['east.com', 'example.com', 'pw.test', 'eastsportsgroup.com'];
        const whitelist = ['admin@east.com', 'coach@east.com', 'parent@east.com', 'player@east.com'];

        const remainingGhosts = allUsers.filter(u => {
            const email = (u.email || '').toLowerCase();
            const domain = email.split('@')[1] || '';
            const isWhitelisted = whitelist.includes(email);
            const isInternal = internalDomains.some(d => domain.endsWith(d));
            return isInternal && !isWhitelisted;
        });

        console.log(`Remaining Ghosts: ${remainingGhosts.length}`);
        if (remainingGhosts.length > 0) {
            const testUser = remainingGhosts[0];
            console.log(`\nDiagnosing user: ${testUser.email} (${testUser.id})`);
            
            // Try deleting profile
            const { error: pError } = await supabase.from('profiles').delete().eq('id', testUser.id);
            if (pError) {
                console.error(`Profile Deletion Error:`, pError);
            } else {
                console.log(`Profile deleted successfully.`);
            }

            // Try deleting from Auth
            const { error: aError } = await supabase.auth.admin.deleteUser(testUser.id);
            if (aError) {
                console.error(`Auth Deletion Error:`, aError);
            } else {
                console.log(`Auth user deleted successfully.`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

diagnoseFailures();
