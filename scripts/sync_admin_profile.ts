
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncAdminProfile() {
    console.log('🔄 Syncing Admin Profile...');

    const ADMIN_EMAIL = 'admin@east.com';

    // 1. Get the User ID from auth.users (using admin API)
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('❌ Error listing users:', userError);
        return;
    }

    const adminUser = users.find((u: any) => u.email === ADMIN_EMAIL);

    if (!adminUser) {
        console.error(`❌ User ${ADMIN_EMAIL} not found in auth.users! You need to sign up first.`);
        return;
    }

    console.log(`✅ Found Admin User: ${adminUser.id} (${adminUser.email})`);

    // 2. Upsert into public.profiles
    const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
            id: adminUser.id,
            email: ADMIN_EMAIL, // Assuming email column exists or is just for reference
            role: 'admin',
            first_name: 'System',
            last_name: 'Admin',
            username: 'sysadmin',
            bio: 'System Administrator',
            credits: 999999,
            contact_email: ADMIN_EMAIL
        })
        .select();

    if (upsertError) {
        console.error('❌ Error creating admin profile:', upsertError);
    } else {
        console.log('✅ Admin profile created/updated successfully!');
    }
}

syncAdminProfile();
