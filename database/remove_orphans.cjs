
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

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

async function removeOrphaned() {
    try {
        console.log('🧹 Removing all non-whitelisted profiles...');
        
        // Fetch all profiles
        let allProfiles = [];
        let from = 0;
        const step = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase.from('profiles').select('id, contact_email').range(from, from + step - 1);
            if (error) throw error;
            allProfiles.push(...data);
            if (data.length < step) hasMore = false;
            else from += step;
        }

        const toDelete = allProfiles.filter(p => !whitelist.includes((p.contact_email || '').toLowerCase()));
        console.log(`Found ${toDelete.length} profiles to remove.`);

        if (toDelete.length === 0) {
            console.log('No profiles to delete.');
            return;
        }

        const idsToDelete = toDelete.map(p => p.id);
        
        // Delete in batches to avoid URL length issues or timeout
        const BATCH_SIZE = 50;
        for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
            const batch = idsToDelete.slice(i, i + BATCH_SIZE);
            
            // Clear dependencies first for this batch
            await Promise.all([
                supabase.from('announcements').delete().in('created_by', batch),
                supabase.from('likes').delete().in('user_id', batch),
                supabase.from('posts').delete().in('user_id', batch),
                supabase.from('messages').delete().in('sender_id', batch),
                supabase.from('messages').delete().in('receiver_id', batch),
                supabase.from('players_stats').delete().in('verified_by', batch),
                supabase.from('registrations').update({ payer_id: null }).in('payer_id', batch),
                supabase.from('admin_audit_logs').delete().in('admin_id', batch)
            ]);

            const { error: dError } = await supabase.from('profiles').delete().in('id', batch);
            if (dError) {
                console.error(`❌ Error deleting batch:`, dError.message);
            } else {
                console.log(`Deleted batch ${i/BATCH_SIZE + 1}...`);
            }
        }

        console.log('✨ Orphaned profile cleanup finished!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

removeOrphaned();
