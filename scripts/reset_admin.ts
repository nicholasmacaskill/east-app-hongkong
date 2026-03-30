import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetAdmin() {
    console.log("Looking up admin@east.com...");
    
    let allUsers = [];
    let hasMore = true;
    let page = 1;
    
    while (hasMore) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
        if (error) {
            console.error("Error listing users:", error);
            return;
        }
        allUsers = allUsers.concat(data.users);
        hasMore = data.users.length === 100;
        page++;
    }
    
    const adminUser = allUsers.find(u => u.email === 'admin@east.com');
    
    if (adminUser) {
        console.log(`Found existing admin! ID: ${adminUser.id}. Resetting password to password123...`);
        
        const { data, error: updateError } = await supabase.auth.admin.updateUserById(
            adminUser.id,
            { password: 'password123', email_confirm: true }
        );
        
        if (updateError) {
            console.error("Error updating user:", updateError);
        } else {
            console.log("✅ Password reset securely.");
            await supabase.from('profiles').update({ role: 'sys-admin' }).eq('id', adminUser.id);
            console.log("✅ Attached sys-admin profile role securely.");
        }
    } else {
        console.log("Could not find admin user across all pages.");
    }
}
resetAdmin();
