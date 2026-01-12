import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
    console.log('🔍 verifying sysadmin@east.com profile...');

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === 'sysadmin@east.com');

    if (!user) {
        console.error('❌ User not found in Auth!');
        return;
    }
    console.log(`✅ Auth User Found: ${user.id}`);

    // 2. Get Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('❌ Profile Fetch Error:', profileError);
    } else {
        console.log('✅ Profile Found:', profile);
        console.log(`Checking Role: '${profile.role}'`);
        console.log(`Is role correct? ${profile.role === 'sys-admin' ? 'YES' : 'NO'}`);
    }
})();
