import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
            process.env[key] = value;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

const sbAdmin = createClient(supabaseUrl, serviceRoleKey);

const ADMIN_EMAIL = 'reception@east.com';
const ADMIN_PASSWORD = 'EastReception2026!';

async function createReceptionAdmin() {
    console.log(`🚀 Creating Reception Admin: ${ADMIN_EMAIL}...`);

    // 1. Check if user exists in Auth
    const { data: { users }, error: listError } = await sbAdmin.auth.admin.listUsers();
    if (listError) {
        console.error("❌ Error listing users:", listError);
        return;
    }

    let userId = users?.find(u => u.email === ADMIN_EMAIL)?.id;

    if (userId) {
        console.log("✅ User already exists in Auth. ID:", userId);
    } else {
        console.log("Creating new Auth User...");
        const { data, error } = await sbAdmin.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: {
                role: 'sys-admin',
                first_name: 'Reception',
                last_name: 'Admin'
            }
        });

        if (error) {
            console.error("❌ Error creating user:", error);
            return;
        }
        userId = data.user?.id;
        console.log("✅ Created new Auth User. ID:", userId);
    }

    if (!userId) return;

    // 2. Ensure Profile exists with sys-admin role
    // Note: trigger handle_new_user might have already created it, so we upsert to be sure
    const { error: profileError } = await sbAdmin
        .from('profiles')
        .upsert({
            id: userId,
            username: 'reception',
            first_name: 'Reception',
            last_name: 'Admin',
            contact_email: ADMIN_EMAIL,
            role: 'sys-admin',
            tier: 'individual',
            membership_tier: 'individual'
        }, { onConflict: 'id' });

    if (profileError) {
        console.error("❌ Error updating profile:", profileError);
    } else {
        console.log("✅ Admin Profile updated with role='sys-admin'.");
    }
    
    console.log(`\n🎉 DONE! User: ${ADMIN_EMAIL} | Password: ${ADMIN_PASSWORD}`);
}

createReceptionAdmin();
