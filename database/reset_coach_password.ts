import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function resetPassword() {
    const email = 'nickmac1@gmail.com';
    console.log(`--- RESETTING PASSWORD FOR ${email} ---`);

    // 1. Find the user ID
    const { data: users, error: fError } = await supabase.auth.admin.listUsers();
    if (fError) {
        console.error('Error listing users:', fError.message);
        return;
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
        console.error('User not found.');
        return;
    }

    // 2. Update password
    const { data, error: uError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: 'password123' }
    );

    if (uError) {
        console.error('Error updating password:', uError.message);
    } else {
        console.log('✅ Password successfully reset to: password123');
    }
}

resetPassword();
