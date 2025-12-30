
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TARGET_EMAIL = 'coach@east.com';
const CREDITS_TO_ADD = 500;

async function simulateCreditAdd() {
    console.log(`🚀 Simulating Credit Update for ${TARGET_EMAIL}...`);

    // 1. Get User ID
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.find(u => u.email === TARGET_EMAIL);

    if (!user) {
        console.error('User not found!');
        return;
    }
    console.log(`Found User ID: ${user.id}`);

    // 2. Get Current Credits
    const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', user.id).single();
    const currentCredits = profile?.credits || 0;
    console.log(`Current Credits: ${currentCredits}`);

    // 3. Add Credits (Mimic Webhook Logic)
    console.log(`Adding ${CREDITS_TO_ADD}...`);
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({
            credits: currentCredits + CREDITS_TO_ADD,
        })
        .eq('id', user.id);

    if (error) {
        console.error('❌ Update Failed:', error.message);
    } else {
        console.log('✅ Update Success!');
    }

    // 4. Verify Final State
    const { data: finalProfile } = await supabaseAdmin.from('profiles').select('credits').eq('id', user.id).single();
    console.log(`New Balance: ${finalProfile?.credits}`);
}

simulateCreditAdd().catch(console.error);
