import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function seedDemoSession() {
    console.log('--- SEEDING REAL DEMO SESSION FOR COACH & ATHLETE ---');

    const coachId = '6f9878d7-c199-495c-bc45-e61899ddf7ef';
    const athleteId = '759d0a44-4bc8-4c2b-be1b-4c6eefe076e7';

    // 1. Update profiles with readable first/last names
    console.log('Updating Coach profile names...');
    const { error: coachErr } = await supabase
        .from('profiles')
        .update({
            first_name: 'Coach',
            last_name: 'Nick',
            role: 'coach'
        })
        .eq('id', coachId);

    if (coachErr) {
        console.error('Error updating coach profile:', coachErr.message);
    } else {
        console.log('✅ Coach profile updated (Coach Nick)');
    }

    console.log('Updating Athlete profile names...');
    const { error: athleteErr } = await supabase
        .from('profiles')
        .update({
            first_name: 'Ghost',
            last_name: 'Athlete',
            role: 'player'
        })
        .eq('id', athleteId);

    if (athleteErr) {
        console.error('Error updating athlete profile:', athleteErr.message);
    } else {
        console.log('✅ Athlete profile updated (Ghost Athlete)');
    }

    // 2. Clean up old registrations & sessions to keep it clean
    console.log('Cleaning up existing registrations for athlete...');
    await supabase.from('registrations').delete().eq('user_id', athleteId);

    // 3. Create a new future session (2 hours from now)
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 2);
    startTime.setMinutes(0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    console.log('Creating new session...');
    const { data: session, error: sessionErr } = await supabase
        .from('sessions')
        .insert({
            title: 'CEO Demo Training Class',
            instructor: 'Coach Nick',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            max_capacity: 10,
            category: 'PERFORMANCE',
            credit_cost: 10
        })
        .select()
        .single();

    if (sessionErr) {
        console.error('Error creating session:', sessionErr.message);
        return;
    }

    console.log(`✅ Session created successfully! ID: ${session.id}`);

    // 4. Create registration for the Athlete to this Session
    console.log('Registering athlete to session...');
    const { error: regErr } = await supabase
        .from('registrations')
        .insert({
            user_id: athleteId,
            session_id: session.id,
            payer_id: athleteId,
            credits_paid: 0,
            attended: false
        });

    if (regErr) {
        console.error('Error creating registration:', regErr.message);
    } else {
        console.log('✅ Athlete successfully registered to CEO Demo Training Class!');
    }
}

seedDemoSession();
