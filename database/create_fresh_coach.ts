import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function createCoach() {
    const email = 'nickmac1@gmail.com';
    console.log(`--- CREATING FRESH COACH ACCOUNT: ${email} ---`);

    // 1. Create the Auth User
    const { data: authUser, error: aError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'password123',
        email_confirm: true,
        user_metadata: { role: 'coach' }
    });

    if (aError) {
        console.error('Error creating auth user:', aError.message);
        // If user already exists, we'll try to update them
        if (aError.message.includes('already registered')) {
             console.log('User already exists, checking profiles...');
        } else {
            return;
        }
    }

    const userId = authUser.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id;

    if (!userId) {
        console.error('Could not find or create user ID.');
        return;
    }

    // 2. Upsert the Profile
    const { error: pError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            first_name: 'Nick',
            last_name: 'Coach',
            role: 'coach',
            email: email
        });

    if (pError) {
        console.error('Error updating profile:', pError.message);
    } else {
        console.log('✅ Account successfully created!');
        console.log(`Email: ${email}`);
        console.log('Password: password123');
    }
}

createCoach();
