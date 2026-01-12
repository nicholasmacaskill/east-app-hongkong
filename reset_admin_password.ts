import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

(async () => {
    const email = 'admin@east.com';
    const newPassword = 'password123';

    try {
        console.log(`🔄 Finding admin user: ${email}...`);

        // Get all users and find admin
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('❌ Error listing users:', listError.message);
            process.exit(1);
        }

        const adminUser = users.find(u => u.email === email);

        if (!adminUser) {
            console.error(`❌ Admin user ${email} not found!`);
            console.log('\nAvailable users:');
            users.forEach(u => console.log(`  - ${u.email} (${u.id})`));
            process.exit(1);
        }

        console.log(`✅ Found admin user: ${adminUser.id}`);
        console.log(`🔄 Resetting password...`);

        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            adminUser.id,
            { password: newPassword }
        );

        if (updateError) {
            console.error('❌ Error updating password:', updateError.message);
            process.exit(1);
        }

        console.log('\n✅ Password reset successfully!');
        console.log(`\n📧 Email: ${email}`);
        console.log(`🔑 Password: ${newPassword}`);
        console.log('\nYou can now log in with these credentials.');

    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
})();
