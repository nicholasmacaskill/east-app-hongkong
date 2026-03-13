import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SEED_EMAILS = [
    'admin@east.com',
    'coach@east.com',
    'parent@east.com',
    'player@east.com'
];

async function comprehensiveCleanup() {
    const isConfirm = process.argv.includes('--confirm');
    const isDryRun = !isConfirm;

    console.log(`\n🧹 Starting Comprehensive Database Cleanup... (${isDryRun ? 'DRY RUN' : 'CONFIRMED DELETION'})`);
    console.log('='.repeat(80));

    try {
        // 1. Fetch data
        console.log('Fetching auth users...');
        let allAuthUsers: any[] = [];
        let page = 1;
        const perPage = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ page, perPage });
            if (listError) throw listError;
            allAuthUsers.push(...users);
            if (users.length < perPage) hasMore = false;
            else page++;
        }
        console.log(`- Total Auth Users: ${allAuthUsers.length}`);

        console.log('Fetching profiles...');
        const { data: allProfiles, error: profileError } = await supabase.from('profiles').select('*');
        if (profileError) throw profileError;
        console.log(`- Total Profiles: ${allProfiles.length}`);

        // 2. Identify Cleanup Targets
        const authUserIds = new Set(allAuthUsers.map(u => u.id));
        const testPatterns = [
            /@pw\.test$/,
            /test/,
            /login/,
            /audit/,
            /@test\.com$/
        ];

        const targets: Set<string> = new Set();
        const targetDetails: any[] = [];

        // Check Auth Users for test patterns
        allAuthUsers.forEach(user => {
            const email = user.email?.toLowerCase() || '';
            const matchesPattern = testPatterns.some(p => p.test(email));
            const isSeed = SEED_EMAILS.includes(email);

            if (matchesPattern && !isSeed) {
                targets.add(user.id);
                targetDetails.push({ id: user.id, email: email, reason: 'Auth Pattern Match' });
            }
        });

        // Check Profiles for test patterns or orphans
        allProfiles.forEach(profile => {
            const email = (profile.contact_email || '').toLowerCase();
            const username = (profile.username || '').toLowerCase();
            const isSeed = SEED_EMAILS.includes(email);

            // Pattern match in profile
            const matchesPattern = testPatterns.some(p => p.test(email)) || username.includes('test');
            if (matchesPattern && !isSeed) {
                if (!targets.has(profile.id)) {
                    targets.add(profile.id);
                    targetDetails.push({ id: profile.id, email: email || 'N/A', username: username, reason: 'Profile Pattern Match' });
                }
            }

            // Orphan check
            if (!authUserIds.has(profile.id)) {
                if (!targets.has(profile.id)) {
                    targets.add(profile.id);
                    targetDetails.push({ id: profile.id, email: email || 'N/A', reason: 'Orphaned Profile' });
                }
            }
        });

        console.log(`\nIdentified ${targets.size} targets for removal.`);
        console.log('-'.repeat(80));
        targetDetails.forEach(t => {
            console.log(`- [${t.reason}] ID: ${t.id} | Email: ${t.email} ${t.username ? '| User: ' + t.username : ''}`);
        });

        if (targets.size === 0) {
            console.log('\n✨ No targets found. Database is clean.');
            return;
        }

        if (isDryRun) {
            console.log('\n' + '='.repeat(80));
            console.log('✨ DRY RUN COMPLETE. No data was deleted.');
            console.log('Run with --confirm to execute actual deletion.');
            return;
        }

        // 3. Execution
        console.log('\n🚀 Executing Deletion...');
        const tablesToDeleteFrom = [
            'admin_audit_logs',
            'registrations',
            'transactions',
            'coach_services',
            'posts',
            'messages',
            'likes',
            'profiles'
        ];

        for (const id of targets) {
            const detail = targetDetails.find(d => d.id === id);
            console.log(`\nRemoving: ${detail.email} (${id})...`);

            // Delete from all linked tables
            for (const table of tablesToDeleteFrom) {
                let targetCol = 'id';
                if (['registrations', 'transactions', 'posts', 'messages', 'likes'].includes(table)) targetCol = 'user_id';
                if (table === 'coach_services') targetCol = 'coach_id';
                if (table === 'admin_audit_logs') targetCol = 'admin_id';

                const { error: delError } = await supabase.from(table).delete().eq(targetCol, id);
                if (delError) {
                    // Silently fail if table doesn't exist or column is wrong, but log real errors
                    if (!delError.message.includes('column') && !delError.message.includes('relation')) {
                        console.warn(`  - Warning: Failed delete from ${table}:`, delError.code === '42703' ? 'Column not found' : delError.message);
                    }
                } else {
                    console.log(`  - Deleted from ${table}`);
                }
            }

            // Finally delete from Auth if it exists
            if (authUserIds.has(id)) {
                const { error: authDelError } = await supabase.auth.admin.deleteUser(id);
                if (authDelError) {
                    console.error(`  - ❌ Failed to delete Auth user:`, authDelError.message);
                } else {
                    console.log(`  - Deleted from Auth`);
                }
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('✨ CLEANUP COMPLETE.');

    } catch (error) {
        console.error('\n❌ Cleanup Error:', error);
    }
}

comprehensiveCleanup();
