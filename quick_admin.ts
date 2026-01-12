import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
    const email = 'sysadmin@east.com';
    const password = 'Admin2024!';

    console.log('Creating sys-admin account...\n');

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            first_name: 'System',
            last_name: 'Admin',
            role: 'sys-admin'
        }
    });

    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }

    console.log('✅ Account created!\n');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('\nLog in with these credentials.');
})();
