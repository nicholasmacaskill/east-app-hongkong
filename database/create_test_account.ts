import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function createTestAccount() {
    const supabaseAdmin = getSupabaseAdmin();
    const email = 'test-refund@eastsportsgroup.com';
    const password = 'EastTest2026!';
    const firstName = 'Test';
    const lastName = 'Refund';

    console.log(`Checking if user ${email} exists...`);

    // 1. Create User in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            first_name: firstName,
            last_name: lastName,
            role: 'player'
        }
    });

    if (authError) {
        if (authError.message.includes('already been registered')) {
            console.log('User already exists. Proceeding to update profile...');
        } else {
            console.error('Error creating auth user:', authError);
            return;
        }
    }

    const userId = authData?.user?.id || (await supabaseAdmin.from('profiles').select('id').eq('contact_email', email).single()).data?.id;

    if (!userId) {
        console.error('Could not find or create User ID.');
        return;
    }

    console.log(`Target User ID: ${userId}`);

    // 2. Set Profile State (Credits & Membership)
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + 30);

    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            first_name: firstName,
            last_name: lastName,
            role: 'player',
            credits: 5000,
            membership_start: now.toISOString(),
            membership_expires: expiry.toISOString(),
            account_status: 'active'
        })
        .eq('id', userId);

    if (profileError) {
        console.error('Error updating profile:', profileError);
        return;
    }

    console.log('--- TEST ACCOUNT READY ---');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Credits: 5000`);
    console.log(`Expiry: ${expiry.toDateString()}`);
}

createTestAccount();
