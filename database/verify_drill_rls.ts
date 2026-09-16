/**
 * Verify: Drill Hub RLS policies + PO user role
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

async function verify() {
    console.log('\n=== 1. Current RLS Policies on coach_drills + coach_drill_steps ===\n');
    const { data: policies, error: pErr } = await supabase
        .rpc('exec_sql' as any, {}) // won't work, use direct select
        .then(() => ({ data: null, error: null }))
        .catch(() => ({ data: null, error: null }));

    // Use service role to directly query pg_policies via PostgREST
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: `SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE tablename IN ('coach_drills','coach_drill_steps') ORDER BY tablename, policyname` })
    });

    // Query profiles to find admin/sys-admin users (PO candidates)
    console.log('\n=== 2. Admin/Sys-Admin users in profiles ===\n');
    const { data: admins, error: aErr } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .in('role', ['admin', 'sys-admin', 'coach']);
    
    if (aErr) console.error('Error:', aErr.message);
    else console.table(admins);

    console.log('\n=== 3. Sample drills (checking coach_id ownership) ===\n');
    const { data: drills, error: dErr } = await supabase
        .from('coach_drills')
        .select('id, title, coach_id, status')
        .limit(5);
    
    if (dErr) console.error('Error:', dErr.message);
    else console.table(drills);
}

verify();
