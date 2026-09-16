/**
 * FIX: Drill Delete Permission for Admin/Sys-Admin
 * Uses direct Postgres connection (pg) - bypasses Supabase run_sql RPC
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const DATABASE_URL = process.env.DATABASE_URL!;

if (!DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL in .env.production.latest');
    process.exit(1);
}

async function applyFix() {
    const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
    
    try {
        await client.connect();
        console.log('✅ Connected to production Postgres\n');

        const steps = [
            {
                label: 'Drop old coach_drills policies',
                sql: `
                    DROP POLICY IF EXISTS "Coaches can manage their drills" ON public.coach_drills;
                    DROP POLICY IF EXISTS "Admins can manage all drills" ON public.coach_drills;
                    DROP POLICY IF EXISTS "Coaches and Admins can manage drills" ON public.coach_drills;
                `
            },
            {
                label: 'Create unified coach+admin DELETE policy for coach_drills',
                sql: `
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
                `
            },
            {
                label: 'Drop old coach_drill_steps policies',
                sql: `
                    DROP POLICY IF EXISTS "Coaches can manage drill steps" ON public.coach_drill_steps;
                    DROP POLICY IF EXISTS "Admins can manage all drill steps" ON public.coach_drill_steps;
                    DROP POLICY IF EXISTS "Coaches and Admins can manage drill steps" ON public.coach_drill_steps;
                `
            },
            {
                label: 'Create unified coach+admin DELETE policy for coach_drill_steps',
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
            },
            {
                label: 'Reload PostgREST schema cache',
                sql: `NOTIFY pgrst, 'reload schema';`
            }
        ];

        for (const step of steps) {
            console.log(`⏳ ${step.label}...`);
            await client.query(step.sql);
            console.log(`   ✅ Done`);
        }

        // Verify
        console.log('\n🔍 Verifying policies now in production:\n');
        const result = await client.query(`
            SELECT tablename, policyname, cmd 
            FROM pg_policies 
            WHERE tablename IN ('coach_drills', 'coach_drill_steps')
            ORDER BY tablename, policyname;
        `);
        
        console.table(result.rows);
        console.log('\n✅ Fix applied successfully! PO can now delete any drill.');

    } catch (e: any) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyFix();
