import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
    console.log('🔍 Checking RLS Policies matching...');

    // We can't query policies directly via JS client easily without SQL, 
    // so we'll test access by trying to read a profile as a "user"

    const testEmail = 'player@east.com';
    console.log(`Testing access for ${testEmail}...`);

    // 1. Log in as player
    const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'password123'
    });

    if (authError) {
        console.error('Login failed:', authError.message);
        // Try to create if not exists, just to have a test user
        return;
    }

    console.log('✅ Logged in as player:', auth.user.id);

    // 2. Try to read OWN profile
    const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${auth.session?.access_token}` } }
    });

    const { data: profile, error: profileError } = await userClient
        .from('profiles')
        .select('*')
        .eq('id', auth.user.id)
        .single();

    if (profileError) {
        console.error('❌ RLS BLOCKED READ:', profileError);
    } else {
        console.log('✅ RLS ALLOWED READ:', profile.id);
    }

})();
