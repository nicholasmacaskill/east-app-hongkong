import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const COACHES = [
    { email: 'whitney@east.com', firstName: 'Whitney', lastName: 'Coach' },
    { email: 'rhett@east.com', firstName: 'Rhett', lastName: 'Coach' }
];

async function restoreCoaches() {
    console.log('🚀 Restoring Coach Accounts...');

    for (const coach of COACHES) {
        console.log(`\nProcessing: ${coach.email}`);

        // 1. Create Auth User
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email: coach.email,
            password: 'password123',
            email_confirm: true,
            user_metadata: { role: 'coach', first_name: coach.firstName, last_name: coach.lastName }
        });

        if (createError) {
            if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
                console.log(`- Auth user already exists.`);
            } else {
                console.error(`- ❌ Failed to create Auth user:`, createError.message);
                continue;
            }
        }

        const { data: usersData } = await supabase.auth.admin.listUsers();
        const userId = usersData.users.find(u => u.email === coach.email)?.id;

        if (userId) {
            console.log(`- User ID: ${userId}`);

            // 2. Create/Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    role: 'coach',
                    contact_email: coach.email,
                    first_name: coach.firstName,
                    last_name: coach.lastName,
                    username: coach.firstName.toLowerCase()
                });

            if (profileError) {
                console.error(`- ❌ Failed to update profile:`, profileError.message);
            } else {
                console.log(`- ✅ Profile restored as 'coach'.`);
            }
        }
    }

    console.log('\n✨ Restoration Complete.');
}

restoreCoaches();
