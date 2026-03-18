import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function cleanupTestUsers(dryRun: boolean = true) {
    const supabase = getSupabaseAdmin();
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    console.log(`--- User Cleanup Protocol ---`);
    console.log(`Targeting users created after: ${lastWeek.toISOString()}`);
    console.log(`Mode: ${dryRun ? 'DRY RUN (No deletions)' : 'LIVE (DELETION ACTIVE)'}`);

    const { data: users, error } = await supabase
        .from('profiles')
        .select('id, contact_email, first_name, last_name, role, created_at')
        .gte('created_at', lastWeek.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    if (!users || users.length === 0) {
        console.log('No users found in the target window.');
        return;
    }

    const testUsers = users.filter(user => {
        // PERMITTED ROLES: Never delete coaches or admins
        if (user.role === 'coach' || user.role === 'sys-admin' || user.role === 'admin') return false;

        const email = user.contact_email?.toLowerCase() || '';
        const firstName = user.first_name?.toLowerCase() || '';
        const lastName = user.last_name?.toLowerCase() || '';

        // TEST IDENTIFIERS
        const isTestEmail = email.includes('test') || email.includes('example.com') || email.includes('asdf') || email.includes('qwerty') || email.startsWith('puser');
        const isTestName = firstName.includes('test') || lastName.includes('test');
        
        return isTestEmail || isTestName;
    });

    if (testUsers.length === 0) {
        console.log('No test users identified for cleanup.');
        return;
    }

    console.log(`\nIdentified ${testUsers.length} test users for removal:`);
    testUsers.forEach(u => {
        console.log(`- [${u.id}] ${u.first_name} ${u.last_name} (${u.contact_email}) - Created: ${u.created_at}`);
    });

    if (dryRun) {
        console.log('\nDRY RUN COMPLETE. No actions taken.');
        return;
    }

    console.log('\n--- PROCEEDING WITH DELETION ---');
    for (const user of testUsers) {
        console.log(`Processing: ${user.contact_email}...`);
        
        // 1. Delete from Auth (this usually cascades to profiles via triggers, but we'll be explicit)
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
        if (authError) {
            console.error(`Failed to delete Auth record for ${user.id}:`, authError.message);
        } else {
            console.log(`✅ Deleted Auth record for ${user.id}`);
        }

        // 2. Ensure Profile is gone (in case trigger isn't set up for cascade)
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);
            
        if (profileError) {
            console.error(`Failed to delete Profile record for ${user.id}:`, profileError.message);
        } else {
            console.log(`✅ Deleted Profile record for ${user.id}`);
        }
    }

    console.log('\nCleanup operation finished.');
}

const isLive = process.argv.includes('--live');
cleanupTestUsers(!isLive);
