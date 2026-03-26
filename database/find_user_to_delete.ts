import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findAndLog() {
    const targetEmail = 'eastsportsgroup@gmail.com';
    
    // 1. Find the user in profiles by contact_email
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('contact_email', targetEmail);

    if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log(`No profile found with contact_email matching ${targetEmail}`);
        
        // As a fallback, try to list all users just in case they are only in auth.users
        console.log("Checking auth.users manually...");
        let page = 1;
        let hasMore = true;
        while(hasMore) {
            const { data: { users }, error } = await supabase.auth.admin.listUsers({page, perPage: 1000});
            if (error) throw error;
            const match = users.find(u => u.email?.toLowerCase() === targetEmail);
            if (match) {
                console.log(`Found in auth.users (but not profiles): ${match.email} (${match.id})`);
                break;
            }
            if (users.length < 1000) hasMore = false;
            page++;
        }
        return;
    }

    for (const mainProfile of profiles) {
        console.log(`Found main profile: ${mainProfile.first_name} ${mainProfile.last_name} (${mainProfile.contact_email}) - ID: ${mainProfile.id}`);
        
        // Find associated children / contacts
        // Check profiles where parent_id = mainProfile.id
        const { data: childrenProfiles } = await supabase.from('profiles').select('*').eq('parent_id', mainProfile.id);
        if (childrenProfiles && childrenProfiles.length > 0) {
            console.log(`Found ${childrenProfiles.length} children by parent_id:`);
            childrenProfiles.forEach(c => console.log(` - Child profile: ${c.first_name} ${c.last_name} (${c.id})`));
        } else {
            console.log('No children found by parent_id.');
        }

        // Also check if any other profiles have this parent's contact_email
        const { data: contactsByEmail } = await supabase.from('profiles').select('*').eq('contact_email', targetEmail).neq('id', mainProfile.id);
        if (contactsByEmail && contactsByEmail.length > 0) {
            console.log(`\nFound ${contactsByEmail.length} other profiles with contact_email = ${targetEmail}:`);
            contactsByEmail.forEach(c => console.log(` - Profile: ${c.first_name} ${c.last_name} (${c.id}), parent_id: ${c.parent_id}`));
        }
    }
}

findAndLog();
