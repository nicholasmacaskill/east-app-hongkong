import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkSchema() {
    console.log('🔍 Running Database Integrity & Schema Check...\n');

    const checks = [
        { table: 'booking_cancellations', select: 'id' },
        { table: 'coach_services', select: 'id' },
        { table: 'leaderboard', select: 'id' },
        { table: 'news', select: 'id' },
        { table: 'player_stats', select: 'id' },
        { table: 'stats_metadata', select: 'id' },
        { table: 'teams', select: 'id' },
        { table: 'rosters', select: 'id' },
        { table: 'family_connections', select: 'id' }
    ];

    for (const check of checks) {
        const { error } = await supabase.from(check.table).select(check.select).limit(1);
        process.stdout.write(`Table '${check.table}': `);

        if (error) {
            if (error.code === '42P01') { // relation does not exist
                console.log('❌ MISSING');
            } else {
                console.log(`⚠️ ERROR (${error.message})`);
            }
        } else {
            console.log('✅ EXISTS (Ready)');
        }
    }

    console.log('\n🔍 Checking Critical RPCs...');

    // Testing RPCs by calling them with invalid/dummy data to see if they exist
    const rpcs = [
        { name: 'add_credits', payload: { user_id_param: '00000000-0000-0000-0000-000000000000', amount: 0 } },
        { name: 'transfer_credits', payload: { p_from_user_id: '00000000-0000-0000-0000-000000000000', p_to_user_id: '00000000-0000-0000-0000-000000000000', p_amount: 0 } }
    ];

    for (const rpc of rpcs) {
        const { error } = await supabase.rpc(rpc.name, rpc.payload);
        process.stdout.write(`RPC '${rpc.name}': `);

        if (error && error.message.includes('Could not find')) {
            console.log('❌ MISSING');
        } else {
            console.log('✅ EXISTS');
        }
    }

    console.log('\nDONE.');
}

checkSchema();
