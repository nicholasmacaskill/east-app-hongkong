import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function createTestSession() {
    const email = 'nickmac1@gmail.com';
    console.log(`--- CREATING TEST SESSION FOR ${email} ---`);

    // 1. Get User ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'coach')
        .filter('email', 'is', null) // Handle cases where email is not in profile
        .single();
    
    // We'll search by first_name if email isn't there
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
        console.error('User not found.');
        return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const end = new Date(tomorrow);
    end.setHours(11, 0, 0, 0);

    // 2. Insert Session
    const { data: session, error: sError } = await supabase
        .from('sessions')
        .insert({
            title: 'Drill Linking Verification',
            instructor: 'Nick Coach',
            start_time: tomorrow.toISOString(),
            end_time: end.toISOString(),
            status: 'scheduled'
        })
        .select()
        .single();

    if (sError) {
        console.error('Error creating session:', sError.message);
    } else {
        console.log('✅ Test Session Created Successfully!');
        console.log(`Session ID: ${session.id}`);
        console.log(`Title: ${session.title}`);
        console.log(`Time: ${session.start_time}`);
    }
}

createTestSession();
