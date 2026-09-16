/**
 * MIGRATION: fix_messages_and_profiles_rls
 * Uses Supabase Management API via fetch (bypasses direct PG connection)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// Extract project ref from URL (e.g. "ktlicvvczrlppqkcqedv")
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

async function runSQL(sql: string, label: string) {
    const response = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: sql }),
        }
    );

    if (!response.ok) {
        // Fallback: try RPC exec_sql pattern
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    console.log(`✅ ${label}`);
    return result;
}

async function runMigration() {
    console.log('🔧 Running combined messages + profiles RLS fix via Management API...\n');
    console.log(`📡 Project: ${projectRef}\n`);

    const sqlFile = path.resolve(process.cwd(), 'database/fix_messages_and_profiles_rls.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    try {
        await runSQL(sql, 'Full migration applied');
        console.log('\n🎉 Migration complete! Both bugs should now be fixed:\n');
        console.log('  ✅ messages.receiver_id, team_id, video_url, shared_drill_id, shared_plan_id columns added');
        console.log('  ✅ messages RLS policies fixed (insert, select, delete)');
        console.log('  ✅ profiles RLS — all authenticated users can now read profiles\n');
    } catch (err: any) {
        // Management API didn't work - print the SQL for manual execution
        console.log('\n⚠️  Management API not accessible. Please run this SQL manually in the Supabase SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/ktlicvvczrlppqkcqedv/sql/new\n');
        console.log('──────────────────────────────────────────────────────');
        console.log(sql);
        console.log('──────────────────────────────────────────────────────');
        console.log('\nError details:', err.message);
    }
}

runMigration();
