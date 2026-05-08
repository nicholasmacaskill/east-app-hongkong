import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createSysAdmin() {
    console.log("Creating test sys-admin...");
    
    // 1. Create user in auth.users
    const email = "sysadmin_test@eastsports.com";
    const password = "Password123!";
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            role: 'sys-admin',
            first_name: 'System',
            last_name: 'Admin'
        }
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
            console.log("User already exists. You can log in with", email, password);
            return;
        }
        console.error("Failed to create auth user:", authError);
        return;
    }

    // 2. Ensure profile exists and has sys-admin role
    if (authUser.user) {
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authUser.user.id,
                role: 'sys-admin',
                first_name: 'System',
                last_name: 'Admin',
                contact_email: email,
                account_status: 'active'
            });
            
        if (profileError) {
            console.error("Failed to update profile:", profileError);
            return;
        }
        console.log("Test sys-admin created successfully!");
        console.log("Email:", email);
        console.log("Password:", password);
    }
}

createSysAdmin();
