import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Manual env load
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
                if (key && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.log("Could not read .env.local");
}

async function hotfixCriticalIssues() {
    const dbPort = process.env.DB_PORT || '54322';
    const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
        port: parseInt(dbPort, 10),
    };

    const pool = new Pool(config);

    try {
        console.log('🚑 HOTFIX: Critical Audit Issues Remediation');
        console.log('='.repeat(60));

        // ISSUE #1: Add payer_id column to registrations table
        console.log('\n[1/4] Adding payer_id column to registrations table...');
        await pool.query(`
            ALTER TABLE public.registrations 
            ADD COLUMN IF NOT EXISTS payer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
        `);
        console.log('✅ payer_id column added');

        // ISSUE #2: Update book_session_with_credits function to support payer_id
        console.log('\n[2/4] Updating book_session_with_credits function...');
        await pool.query(`
            CREATE OR REPLACE FUNCTION public.book_session_with_credits(
                p_user_id uuid,
                p_session_id bigint,
                p_attendee_id uuid DEFAULT NULL
            )
            RETURNS json
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            DECLARE
                v_credit_cost int;
                v_user_credits int;
                v_attendee_id uuid;
            BEGIN
                -- Get session cost
                SELECT credit_cost INTO v_credit_cost FROM sessions WHERE id = p_session_id;
                
                -- Get payer credits
                SELECT credits INTO v_user_credits FROM profiles WHERE id = p_user_id;

                IF v_credit_cost IS NULL THEN
                    RETURN json_build_object('success', false, 'message', 'Session cost not defined.');
                END IF;

                IF v_user_credits < v_credit_cost THEN
                    RETURN json_build_object('success', false, 'message', 'Insufficient credits.');
                END IF;

                -- Deduct credits from PAYER
                UPDATE profiles SET credits = credits - v_credit_cost WHERE id = p_user_id;
                
                -- Determine attendee (child if provided, otherwise payer)
                v_attendee_id := COALESCE(p_attendee_id, p_user_id);
                
                -- Insert registration with payer_id tracking
                INSERT INTO registrations (user_id, session_id, payer_id) 
                VALUES (v_attendee_id, p_session_id, p_user_id);

                RETURN json_build_object(
                    'success', true, 
                    'message', 'Booking confirmed!', 
                    'new_balance', v_user_credits - v_credit_cost
                );
            END;
            $$;
        `);
        console.log('✅ book_session_with_credits updated with payer_id support');

        // ISSUE #3: Enable RLS on all tables
        console.log('\n[3/4] Enabling RLS on all tables...');
        const tables = [
            'profiles',
            'registrations',
            'sessions',
            'players_stats',
            'posts',
            'likes',
            'messages',
            'availability',
            'voice_commands',
            'player_relationships'
        ];

        for (const table of tables) {
            await pool.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
            console.log(`  ✅ RLS enabled on ${table}`);
        }

        // ISSUE #4: Reload schema to apply changes
        console.log('\n[4/4] Reloading PostgREST schema...');
        await pool.query("NOTIFY pgrst, 'reload schema';");
        console.log('✅ Schema reloaded');

        console.log('\n' + '='.repeat(60));
        console.log('✅ HOTFIX COMPLETE: All critical database issues resolved');
        console.log('\nRemaining fixes needed (see audit_report.md):');
        console.log('  - Update schema.sql (lines 83, 133, 337)');
        console.log('  - Update production_bundle.sql');
        console.log('  - Fix create-player route URL (app/api/admin/create-player/route.ts:17)');
        console.log('  - Consolidate admin client imports (medium priority)');

    } catch (err: any) {
        console.error('❌ Hotfix failed:', err.message);
        throw err;
    } finally {
        await pool.end();
    }
}

hotfixCriticalIssues();
