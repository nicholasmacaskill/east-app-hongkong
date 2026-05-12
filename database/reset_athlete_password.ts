import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function resetAthletePassword() {
    const email = 'test-ghost-1775086280498@east.com';
    console.log(`--- RESETTING ATHLETE PASSWORD: ${email} ---`);

    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);

    if (!user) {
        console.error('User not found.');
        return;
    }

    const { error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: 'password123' }
    );

    if (error) {
        console.error('Error resetting password:', error.message);
    } else {
        console.log('✅ Athlete password successfully reset to: password123');
    }
}

resetAthletePassword();
