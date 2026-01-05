import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local manually to avoid dotenv dependency
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["'](.*)["']$/, '$1'); // remove quotes
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

const ADMIN_EMAIL = 'admin@east.com';
const ADMIN_PASSWORD = 'password123';

async function seedAdmin() {
    console.log(`🚀 Seeding Admin User: ${ADMIN_EMAIL}...`);

    // 1. Check if user exists
    const { data: { users }, error: listError } = await sbAdmin.auth.admin.listUsers();

    if (listError) {
        console.error("❌ Error listing users:", listError);
        return;
    }

    let userId = users?.find(u => u.email === ADMIN_EMAIL)?.id;

    if (userId) {
        console.log("✅ User exists in Auth. ID:", userId);
    } else {
        // Create new user
        console.log("Creating new Auth User...");
        const { data, error } = await sbAdmin.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: {
                role: 'admin',
                first_name: 'System',
                last_name: 'Admin'
            }
        });

        if (error) {
            console.error("❌ Error creating user:", error);
            return;
        }
        console.log("✅ Created new Auth User. ID:", data.user?.id);
        userId = data.user?.id;
    }

    if (!userId) return;

    // 2. Upsert Profile to guarantee Admin Role
    const { error: profileError } = await sbAdmin
        .from('profiles')
        .upsert({
            id: userId,
            username: 'sysadmin',
            first_name: 'System',
            last_name: 'Admin',
            contact_email: ADMIN_EMAIL,
            role: 'admin',
            tier: 'premium'
        }, { onConflict: 'id' });

    if (profileError) {
        console.error("❌ Error updating profile:", profileError);
    } else {
        console.log("✅ Admin Profile 'profiles' table updated with role='admin'.");
    }
}

seedAdmin();
