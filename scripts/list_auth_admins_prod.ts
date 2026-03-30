import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAuthUsers() {
    console.log("=== SCANNING PRODUCTION AUTH USERS ===");
    let allUsers = [];
    let page = 1;
    while(true) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        if (data.users.length === 0) break;
        allUsers = allUsers.concat(data.users);
        page++;
        if (page > 5) break;
    }

    console.log(`Found ${allUsers.length} total users.`);
    
    const admins = allUsers.filter(u => u.user_metadata?.role === 'sys-admin' || u.email?.includes('admin') || u.email?.includes('qanic'));
    
    admins.forEach(a => {
        console.log(`- ${a.email} (ID: ${a.id}, Metadata: ${JSON.stringify(a.user_metadata)})`);
    });
}
listAuthUsers();
