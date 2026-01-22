import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseRoleKey);

async function finalAdminFix() {
    const TARGET_EMAIL = 'admin@east.com';

    console.log(`🔍 Finding user ${TARGET_EMAIL}...`);
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.find(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());

    if (!user) {
        console.log(`❌ User ${TARGET_EMAIL} not found. Creating...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: TARGET_EMAIL,
            password: 'password123',
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'Admin', last_name: 'User' }
        });
        if (createError) throw createError;
        console.log(`✅ Created user ${TARGET_EMAIL} (ID: ${newUser.user!.id})`);
        await provisionProfile(newUser.user!.id, TARGET_EMAIL);
    } else {
        console.log(`✅ Found user ${TARGET_EMAIL} (ID: ${user.id}). Updating profile...`);
        await provisionProfile(user.id, TARGET_EMAIL);
    }
}

async function provisionProfile(userId: string, email: string) {
    const { error: profError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            contact_email: email,
            role: 'sys-admin',
            first_name: 'Admin',
            last_name: 'User',
            account_status: 'active'
        });

    if (profError) {
        console.error("❌ Profile Error:", profError);
    } else {
        console.log("🎉 SUCCESS: Admin authorized as sys-admin in live database.");
    }
}

finalAdminFix();
