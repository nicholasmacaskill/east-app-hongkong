
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
    console.log('🚀 Starting Deep Database Cleanup...');

    // 1. Fetch all data
    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (uError) throw uError;

    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) throw pError;

    const { data: coachServices } = await supabase.from('coach_services').select('coach_id');
    const activeCoachIds = new Set(coachServices?.map(cs => cs.coach_id));

    console.log(`Total Auth Users: ${users.length}`);
    console.log(`Total Profiles: ${profiles.length}`);

    // 2. Identify "Keep" set
    const keepIds = new Set();
    const keepRoles = { 'sys-admin': 0, 'coach': 0, 'parent': 0, 'player': 0 };

    // Pass 1: Keep based on specific criteria
    users.forEach(u => {
        const profile = profiles.find(p => p.id === u.id);
        const email = u.email?.toLowerCase() || '';

        let shouldKeep = false;

        // Keep specific domains
        if (email.endsWith('@pm.me') || email.endsWith('@proton.me')) {
            console.log(`📌 Keeping (Admin Domain): ${email}`);
            shouldKeep = true;
        }

        // Keep active coaches
        if (profile?.role === 'coach' && activeCoachIds.has(u.id)) {
            console.log(`📌 Keeping (Active Coach): ${email}`);
            shouldKeep = true;
        }

        if (shouldKeep) {
            keepIds.add(u.id);
            if (profile?.role) keepRoles[profile.role]++;
        }
    });

    // Pass 2: Fill quotas (up to 3 per role if not already filled)
    const roles = ['sys-admin', 'coach', 'parent', 'player'];
    roles.forEach(role => {
        const roleProfiles = profiles.filter(p => p.role === role);
        roleProfiles.forEach(p => {
            if (keepRoles[role] < 3 && !keepIds.has(p.id)) {
                const auth = users.find(u => u.id === p.id);
                if (auth?.email) {
                    console.log(`📌 Keeping (Role Quota - ${role}): ${auth.email}`);
                    keepIds.add(p.id);
                    keepRoles[role]++;
                }
            }
        });
    });

    console.log(`\nRetention Stats:`, keepRoles);
    console.log(`Total IDs to keep: ${keepIds.size}`);

    // 3. Execution: Profiles cleanup (orphans and not-kept)
    const profileIdsToDelete = profiles.filter(p => !keepIds.has(p.id)).map(p => p.id);
    console.log(`🚮 Profiles to delete: ${profileIdsToDelete.length}`);

    for (const id of profileIdsToDelete) {
        // Delete related data first to avoid FK constraints
        // Note: In a real prod DB we'd be more careful about stats/billing history, 
        // but for test data cleanup this is usually sufficient if cascade isn't set.
        await supabase.from('profiles').delete().eq('id', id);
    }

    // 4. Execution: Auth cleanup
    const authIdsToDelete = users.filter(u => !keepIds.has(u.id)).map(u => u.id);
    console.log(`🚮 Auth Users to delete: ${authIdsToDelete.length}`);

    for (const id of authIdsToDelete) {
        const { error: delError } = await supabase.auth.admin.deleteUser(id);
        if (delError) {
            console.error(`❌ Failed to delete auth ${id}:`, delError.message);
        }
    }

    console.log('\n✨ Database Cleanup Finished.');
}

cleanup().catch(err => {
    console.error('Fatal Cleanup Error:', err);
});
