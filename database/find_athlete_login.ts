import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function findAthlete() {
    console.log('--- FINDING ATHLETE LOGIN ---');

    // 1. Get an athlete from the profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('role', 'player')
        .limit(1);

    if (!profiles || profiles.length === 0) {
        console.log('No players found in profiles. Creating a test player...');
        return;
    }

    const playerId = profiles[0].id;

    // 2. Get the email from auth
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.id === playerId);

    if (user) {
        console.log(`\n✅ FOUND ATHLETE LOGIN:`);
        console.log(`Email: ${user.email}`);
        console.log(`Password: password123 (or seeded password)`);
        
        // 3. Register them for the session to be sure
        const { data: session } = await supabase
            .from('sessions')
            .select('id')
            .eq('title', 'Drill Linking Verification')
            .single();

        if (session) {
            await supabase.from('bookings').upsert({
                session_id: session.id,
                user_id: playerId,
                status: 'confirmed'
            });
            console.log(`\nSuccessfully registered ${user.email} for the 'Drill Linking Verification' session.`);
        }
    } else {
        console.log('Could not find auth user for player profile.');
    }
}

findAthlete();
