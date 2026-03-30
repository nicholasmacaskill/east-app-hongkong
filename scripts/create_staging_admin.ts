import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// POINTING TO STAGING (test branch)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
    console.log("=== CREATING ADMINS IN STAGING DATABASE ===");
    
    const adminEmails = ["admin@east.com", "qanic@east.com"];
    
    for (const email of adminEmails) {
        console.log(`Checking for ${email}...`);
        
        let { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
        let user = usersData?.users.find(u => u.email === email);
        
        if (!user) {
            console.log(`User ${email} missing in Staging. Creating...`);
            const { data, error } = await supabase.auth.admin.createUser({
                email: email,
                password: 'password123',
                email_confirm: true
            });
            if (error) {
                console.error("Error creating user:", error);
                continue;
            }
            user = data.user;
            console.log(`✅ Created User ID: ${user.id}`);
        } else {
             console.log(`User ${email} already exists ID: ${user.id}. Resetting password to password123...`);
             await supabase.auth.admin.updateUserById(user.id, { password: 'password123', email_confirm: true });
        }
        
        // Ensure profile exists and has sys-admin role
        const { error: pError } = await supabase.from('profiles').upsert({
            id: user.id,
            contact_email: email,
            role: 'sys-admin',
            first_name: 'Sys',
            last_name: 'Admin',
            credits: 999999
        });
        
        if (pError) {
             console.error("Error updating profile:", pError);
        } else {
             console.log(`✅ Sys-Admin role and profile secured for ${email}`);
        }
    }
}
createAdmin();
