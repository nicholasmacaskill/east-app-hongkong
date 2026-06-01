import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing prod keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetCoachPasswords() {
    console.log('Resetting passwords for test coaches...');
    const emails = ['testcoach@east.com', 'coach.test@east.com'];
    const newPassword = 'EastTest2026!';

    for (const email of emails) {
        // Find the user ID
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
            console.error('Error fetching users:', listError);
            continue;
        }

        const user = users.find(u => u.email === email);
        if (user) {
            console.log(`Found user: ${email} (${user.id}). Updating password...`);
            const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
                password: newPassword
            });
            if (updateError) {
                console.error(`Error updating password for ${email}:`, updateError);
            } else {
                console.log(`✅ Successfully reset password for ${email}`);
            }
        } else {
            console.log(`User not found: ${email}`);
        }
    }
}

resetCoachPasswords();
