import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
    const userId = 'dac5c7ec-ed82-428a-9913-e47fec9ff110';
    const email = 'sysadmin@east.com';

    try {
        console.log('🔄 Creating profile in Supabase...\n');

        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                first_name: 'System',
                last_name: 'Admin',
                username: 'sysadmin',
                contact_email: email,
                role: 'sys-admin',
                credits: 0
            })
            .select();

        if (error) {
            console.error('❌ Error:', error.message);
            console.error('Details:', error);
            process.exit(1);
        }

        console.log('✅ Profile created in Supabase!\n');
        console.log('📧 Email: sysadmin@east.com');
        console.log('🔑 Password: Admin2024!');
        console.log('\nLog out and log back in to access the admin panel.');

    } catch (err: any) {
        console.error('❌ Failed:', err.message);
    }
})();
