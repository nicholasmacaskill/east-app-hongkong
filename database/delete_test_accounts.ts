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

async function deleteTestAccounts() {
    const isConfirm = process.argv.includes('--confirm');
    const isDryRun = !isConfirm;

    console.log(`\n🧹 Starting Database Cleanup... (${isDryRun ? 'DRY RUN' : 'CONFIRMED DELETION'})`);
    console.log('='.repeat(60));

    try {
        // 1. Fetch all users from Auth with pagination
        let allUsers: any[] = [];
        let page = 1;
        const perPage = 1000;
        let hasMore = true;

        console.log('Fetching users from Auth...');
        while (hasMore) {
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
                page,
                perPage
            });
            if (listError) throw listError;
            
            allUsers.push(...users);
            console.log(`- Page ${page}: Found ${users.length} users`);
            
            if (users.length < perPage) {
                hasMore = false;
            } else {
                page++;
            }
        }

        console.log(`Total users in system: ${allUsers.length}`);

        // 2. Define strict patterns for deletion
        const testPatterns = [
            /@pw\.test$/,
            /-test-/,
            /immediate-login-/,
            /^test-refund@eastsportsgroup\.com$/
        ];

        const usersToDelete = allUsers.filter((user: any) => {
            const email = user.email?.toLowerCase() || '';
            
            // Check patterns
            const matchesPattern = testPatterns.some(pattern => pattern.test(email));
            
            // Check @east.com exclusion
            const isEastCom = email.endsWith('@east.com');
            const isSeedEmail = SEED_EMAILS.includes(email);
            const isTestEastCom = isEastCom && !isSeedEmail && (email.includes('test') || email.includes('login'));

            return matchesPattern || isTestEastCom;
        });

        console.log(`Found ${usersToDelete.length} potential test accounts.`);
        console.log('-'.repeat(60));

        if (usersToDelete.length === 0) {
            console.log('No test accounts identified.');
            return;
        }

        // 3. Execution
        for (const user of usersToDelete) {
            console.log(`${isDryRun ? '[MATCH]' : '[DELETING]'} ${user.email} (${user.id})`);

            if (!isDryRun) {
                // Delete from profiles first
                await supabase.from('profiles').delete().eq('id', user.id);
                // Delete from auth
                const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
                if (deleteError) {
                    console.error(`❌ Failed to delete auth user ${user.id}:`, deleteError.message);
                }
            }
        }

        console.log('='.repeat(60));
        if (isDryRun) {
            console.log('✨ DRY RUN COMPLETE. No data was deleted.');
            console.log('Run with --confirm to execute actual deletion.');
        } else {
            console.log('✨ CLEANUP COMPLETE.');
        }

    } catch (error) {
        console.error('❌ Cleanup Error:', error);
    }
}

deleteTestAccounts();
