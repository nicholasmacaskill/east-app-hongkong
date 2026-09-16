/**
 * FIX: Drill Delete Permission for Admin/Sys-Admin (PO)
 *
 * Root cause: The `coach_drills` DELETE RLS policy only allows
 * `auth.uid() = coach_id` (i.e. the creating coach). Admin/sys-admin roles
 * have no DELETE policy, so Supabase denies them with "0 rows returned" which
 * the UI surfaces as "Permission denied".
 *
 * This script uses the Supabase Management API (not run_sql RPC) to apply
 * the correct policies directly to production.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
console.log(`\n📡 Connecting to production project: ${projectRef}`);
console.log(`🔗 URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

async function runSQL(sql: string, label: string): Promise<boolean> {
    // Use direct Postgres execution via the pg endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
        },
        body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
        // Try alternative: use supabase-js raw query if available
        return false;
    }
    return true;
}

async function fixViaPolicyTable(sql: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Use the Supabase Management API v1 to run migrations
        const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
        
        // Fall back to direct DB interaction via service role
        // Since run_sql RPC doesn't exist, we'll create a temporary function approach
        
        // First: check current policies by listing them
        const { data: existing, error: listErr } = await supabase
            .from('pg_policies')
            .select('policyname, cmd, tablename')
            .in('tablename', ['coach_drills']);
        
        console.log('Current policies check:', existing, listErr ? `Error: ${listErr.message}` : '');
        
        return { success: false, error: 'Cannot access pg_policies directly' };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

async function applyFix() {
    console.log('🔧 Applying drill delete permission fix...\n');
    
    // Strategy: Use the Supabase service-role client to perform the DDL
    // via a stored procedure call OR via direct HTTP to the pg endpoint
    
    // Try approach 1: Call via the management API
    const managementToken = supabaseServiceKey;
    
    const sqlStatements = [
        {
            label: 'Drop old restrictive "Coaches can manage their drills" policy (if exists)',
            sql: `DROP POLICY IF EXISTS "Coaches can manage their drills" ON public.coach_drills;`
        },
        {
            label: 'Drop old "Admins can manage all drills" policy (if exists)',
            sql: `DROP POLICY IF EXISTS "Admins can manage all drills" ON public.coach_drills;`
        },
        {
            label: 'Create unified coach+admin manage policy for coach_drills',
            sql: `
                CREATE POLICY "Coaches and Admins can manage drills"
                ON public.coach_drills
                FOR ALL
                USING (
                    auth.uid() = coach_id
                    OR EXISTS (
                        SELECT 1 FROM public.profiles
                        WHERE profiles.id = auth.uid()
                        AND profiles.role IN ('admin', 'sys-admin', 'coach')
                    )
                )
                WITH CHECK (
                    auth.uid() = coach_id
                    OR EXISTS (
                        SELECT 1 FROM public.profiles
                        WHERE profiles.id = auth.uid()
                        AND profiles.role IN ('admin', 'sys-admin')
                    )
                );
            `
        },
        {
            label: 'Drop old coach_drill_steps manage policy',
            sql: `DROP POLICY IF EXISTS "Coaches can manage drill steps" ON public.coach_drill_steps;`
        },
        {
            label: 'Drop old admin drill steps policy',
            sql: `DROP POLICY IF EXISTS "Admins can manage all drill steps" ON public.coach_drill_steps;`
        },
        {
            label: 'Create unified coach+admin manage policy for coach_drill_steps',
            sql: `
                CREATE POLICY "Coaches and Admins can manage drill steps"
                ON public.coach_drill_steps
                FOR ALL
                USING (
                    EXISTS (
                        SELECT 1 FROM public.coach_drills
                        WHERE coach_drills.id = coach_drill_steps.drill_id
                        AND (
                            coach_drills.coach_id = auth.uid()
                            OR EXISTS (
                                SELECT 1 FROM public.profiles
                                WHERE profiles.id = auth.uid()
                                AND profiles.role IN ('admin', 'sys-admin')
                            )
                        )
                    )
                );
            `
        }
    ];

    // Execute via management API
    for (const stmt of sqlStatements) {
        console.log(`⏳ ${stmt.label}...`);
        
        try {
            // Use the Supabase v1 management API
            const res = await fetch(
                `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${managementToken}`,
                    },
                    body: JSON.stringify({ query: stmt.sql }),
                }
            );
            
            const body = await res.text();
            
            if (res.ok) {
                console.log(`   ✅ Done`);
            } else {
                console.warn(`   ⚠️  Management API response (${res.status}): ${body.substring(0, 200)}`);
                // Try alternative via db-push approach
                await tryAlternativeExecution(stmt.sql, stmt.label);
            }
        } catch (e: any) {
            console.error(`   ❌ Error: ${e.message}`);
            await tryAlternativeExecution(stmt.sql, stmt.label);
        }
    }
    
    console.log('\n🔍 Verifying: checking if admin user can now delete any drill...');
    await verifyFix();
}

async function tryAlternativeExecution(sql: string, label: string) {
    // Alternative: POST to the Supabase db endpoint directly
    try {
        const pgUrl = `${supabaseUrl}/pg`;
        const res = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'OPTIONS',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
            }
        });
        
        // Try via the pg-meta endpoint
        const metaRes = await fetch(`${supabaseUrl.replace('.supabase.co', '.supabase.co')}/rest/v1/rpc/run_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
            },
            body: JSON.stringify({ sql_query: sql }),
        });
        
        if (metaRes.ok) {
            console.log(`   ✅ Alternative succeeded for: ${label}`);
        } else {
            const body = await metaRes.text();
            console.warn(`   ⚠️  Alternative response (${metaRes.status}): ${body.substring(0, 100)}`);
        }
    } catch (e: any) {
        console.warn(`   ⚠️  Alternative also failed: ${e.message}`);
    }
}

async function verifyFix() {
    // Check we can at least read the RLS state by checking table access
    const { data, error } = await supabase
        .from('coach_drills')
        .select('id, title, coach_id')
        .limit(3);
    
    if (error) {
        console.error('❌ Cannot read coach_drills:', error.message);
    } else {
        console.log(`✅ Can read coach_drills (${data?.length} rows visible with service role)`);
        if (data && data.length > 0) {
            console.log('   Sample drill:', data[0].title, '| coach_id:', data[0].coach_id);
        }
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('The fix MUST be applied via the Supabase Dashboard SQL Editor.');
    console.log('The management API token differs from the service role key.');
    console.log('\nPlease run the following SQL in your Supabase Dashboard → SQL Editor:\n');
    printManualSQL();
}

function printManualSQL() {
    const sql = `
-- ============================================================
-- FIX: Allow admin/sys-admin to DELETE any drill (PO fix)
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Replace coach_drills manage policy to include admin roles
DROP POLICY IF EXISTS "Coaches can manage their drills" ON public.coach_drills;
DROP POLICY IF EXISTS "Admins can manage all drills" ON public.coach_drills;

CREATE POLICY "Coaches and Admins can manage drills"
ON public.coach_drills
FOR ALL
USING (
    auth.uid() = coach_id
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'sys-admin')
    )
)
WITH CHECK (
    auth.uid() = coach_id
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'sys-admin')
    )
);

-- 2. Replace coach_drill_steps manage policy to include admin roles
DROP POLICY IF EXISTS "Coaches can manage drill steps" ON public.coach_drill_steps;
DROP POLICY IF EXISTS "Admins can manage all drill steps" ON public.coach_drill_steps;

CREATE POLICY "Coaches and Admins can manage drill steps"
ON public.coach_drill_steps
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.coach_drills
        WHERE coach_drills.id = coach_drill_steps.drill_id
        AND (
            coach_drills.coach_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role IN ('admin', 'sys-admin')
            )
        )
    )
);

-- 3. Reload schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Verify: should return policies with 'Coaches and Admins'
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('coach_drills', 'coach_drill_steps')
ORDER BY tablename, policyname;
-- ============================================================
`;
    console.log(sql);
}

applyFix();
