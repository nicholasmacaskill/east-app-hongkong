import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAndRestoreTestCoach() {
    // Check if profile still exists
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, contact_email, role, first_name, last_name')
        .in('contact_email', ['testcoach@east.com', 'coach.test@east.com']);

    console.log('Profiles found:', JSON.stringify(profiles, null, 2));

    // Check auth users
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const testCoaches = users.filter(u => 
        u.email === 'testcoach@east.com' || u.email === 'coach.test@east.com'
    );
    console.log('\nAuth users found:', testCoaches.map(u => ({ id: u.id, email: u.email })));

    // If profile is missing but auth user exists, recreate the profile
    for (const user of testCoaches) {
        const profileExists = profiles?.some(p => p.id === user.id);
        if (!profileExists) {
            console.log(`\n⚠️  Profile missing for ${user.email} — recreating...`);
            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                contact_email: user.email,
                role: 'coach',
                first_name: user.email === 'testcoach@east.com' ? 'Test' : 'Coach',
                last_name: 'Coach',
                account_status: 'active',
                credits: 0,
            });
            if (error) console.error(`❌ Failed to restore profile for ${user.email}:`, error.message);
            else console.log(`✅ Profile restored for ${user.email}`);
        } else {
            console.log(`\n✅ Profile intact for ${user.email}`);
        }
    }
}

checkAndRestoreTestCoach();
