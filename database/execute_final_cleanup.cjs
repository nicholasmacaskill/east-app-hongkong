
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeFinalCleanup() {
    const isConfirm = process.argv.includes('--confirm');
    const isDryRun = !isConfirm;

    console.log(`\n🚀 Starting Final Deep Cleanup... (${isDryRun ? 'DRY RUN' : 'CONFIRMED DELETION'})`);
    console.log('='.repeat(60));

    try {
        // 1. Fetch all users from Auth
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
        const whitelist = [
            'admin@east.com', 'coach@east.com', 'parent@east.com', 'player@east.com',
            'augustine.fan@outlook.com', 'kylern2031@student.edu.hk', 'mattynewland@gmail.com',
            'nickmac@gmail.com', 'nick@gmail.com', 'kiki121hk@hotmail.com',
            'cheungyuhong0905@gmail.com', 'fiona.wy.chow@gmail.com', 'karen.mwli@gmail.com',
            'aydenau88@gmail.com', 'abbyyu0624@gmail.com', 'chavis.suen@gmail.com',
            'jfceccacci@gmail.com', 'carmantingting@yahoo.com.hk', 'isaactham.28@gmail.com',
            'rick@dynevents.com', 'rchuhk@gmail.com', 'carmantingting@gmail.com',
            'nting201314@gmail.com', 'emailherepls@gmail.com', 'cwchenghku@yahoo.com.hk',
            'chaulai312@yahoo.com.hk', 'heliushohoho@gmail.com', 'nichmac1@gmail.com',
            'nicholasmacaskill@proton.me', 'nickmac1@gmail.com', 'bmacaskill27@gmail.com'
        ].map(e => e.toLowerCase());

        const usersToDelete = allUsers.filter(u => {
            const email = u.email ? u.email.toLowerCase() : '';
            if (whitelist.includes(email)) return false;

            const domain = email.split('@')[1] || '';
            const isInternal = internalDomains.some(d => domain.endsWith(d));

            return isInternal;
        });

        console.log(`Found ${usersToDelete.length} high-confidence ghost accounts still in system.`);

        if (usersToDelete.length === 0) {
            console.log('🎉 No ghost accounts remaining!');
            return;
        }

        if (isDryRun) {
            console.log('\n--- DRY RUN SAMPLES ---');
            usersToDelete.slice(0, 10).forEach(u => console.log(`- ${u.email}`));
            console.log('...');
            console.log(`\nTotal to delete: ${usersToDelete.length}`);
            return;
        }

        console.log(`\n⚡ Parallel execution with dependency clearing...`);
        let successCount = 0;
        let failCount = 0;
        const CONCURRENCY = 20; // Lower concurrency for deeper cleanup

        for (let i = 0; i < usersToDelete.length; i += CONCURRENCY) {
            const batch = usersToDelete.slice(i, i + CONCURRENCY);
            await Promise.all(batch.map(async (user) => {
                try {
                    const uid = user.id;

                    // Clear Dependencies
                    await Promise.all([
                        supabase.from('announcements').delete().eq('created_by', uid),
                        supabase.from('likes').delete().eq('user_id', uid),
                        supabase.from('posts').delete().eq('user_id', uid),
                        supabase.from('messages').delete().eq('sender_id', uid),
                        supabase.from('messages').delete().eq('receiver_id', uid),
                        supabase.from('players_stats').delete().eq('verified_by', uid),
                        supabase.from('registrations').update({ payer_id: null }).eq('payer_id', uid),
                        supabase.from('admin_audit_logs').delete().eq('admin_id', uid)
                    ]);

                    // Profile deletion (cascades where configured)
                    const { error: pError } = await supabase.from('profiles').delete().eq('id', uid);
                    if (pError) throw pError;

                    // Auth deletion
                    const { error: aError } = await supabase.auth.admin.deleteUser(uid);
                    if (aError) {
                          // Sometimes Auth deletion returns database error but user is gone from profile
                          // Check if it's a persistent error
                          console.error(`❌ Auth deletion failed for ${user.email}:`, aError.message);
                          failCount++;
                    } else {
                        successCount++;
                    }
                } catch (e) {
                    console.error(`❌ Unexpected error for ${user.email}:`, e.message);
                    failCount++;
                }
            }));
            console.log(`Progress: ${successCount + failCount}/${usersToDelete.length} processed...`);
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✨ Deep Cleanup Finished!`);
        console.log(`Success: ${successCount}`);
        console.log(`Failed : ${failCount}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Fatal Error:', error);
    }
}

executeFinalCleanup();
