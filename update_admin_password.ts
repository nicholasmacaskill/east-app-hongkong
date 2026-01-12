import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

(async () => {
    const adminId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // From find_admin.ts
    const newPassword = 'admin123';
    const email = 'admin@east.com';

    try {
        console.log('🔄 Updating password for existing admin...\n');

        // Update password using admin API
        const { data, error } = await supabase.auth.admin.updateUserById(
            adminId,
            { password: newPassword }
        );

        if (error) {
            console.error('❌ Error:', error.message);
            console.error('Full error:', error);
            process.exit(1);
        }

        console.log('✅ Password updated successfully!\n');
        console.log('🎉 Admin account ready!\n');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', newPassword);
        console.log('\nYou can now log in with these credentials.');

    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
})();
