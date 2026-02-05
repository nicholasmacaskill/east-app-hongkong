import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { Pool } from 'pg';
import getDbPool from '../app/lib/db';

async function migrate() {
    console.log('--- ADMIN AUDIT & SOFT-DELETE MIGRATION ---');
    // Force DATABASE_URL from .env.local which we know has the correct pooler address
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL not found in .env.local');

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    const client = await pool.connect();

    try {
        console.log('1. Adding status column to sessions...');
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'status') THEN
                    ALTER TABLE sessions ADD COLUMN status text DEFAULT 'active';
                END IF;
            END $$;
        `);

        console.log('2. Adding status column to registrations...');
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registrations' AND column_name = 'status') THEN
                    ALTER TABLE registrations ADD COLUMN status text DEFAULT 'confirmed';
                END IF;
            END $$;
        `);

        console.log('3. Creating admin_audit_logs table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                admin_id UUID REFERENCES public.profiles(id),
                action TEXT NOT NULL,
                target_type TEXT,
                target_id TEXT,
                details JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );
            
            -- Enable RLS
            ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
            
            -- Only admins can see audit logs
            DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
            CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM public.profiles
                        WHERE profiles.id = auth.uid()
                        AND profiles.role IN ('admin', 'sys-admin')
                    )
                );
        `);

        console.log('4. Updating cancel_session_and_refund RPC...');
        await client.query(`
            DROP FUNCTION IF EXISTS public.cancel_session_and_refund(uuid, bigint);
            CREATE OR REPLACE FUNCTION public.cancel_session_and_refund(
                p_attendee_id uuid,
                p_session_id bigint
            )
            RETURNS json
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            declare
                v_credit_cost int;
                v_payer_id uuid;
            begin
                -- Check registration and get Payer
                SELECT payer_id INTO v_payer_id 
                FROM registrations 
                WHERE user_id = p_attendee_id AND session_id = p_session_id AND status != 'cancelled';

                if not found then
                    return json_build_object('success', false, 'message', 'Active booking not found.');
                end if;

                -- Default payer to attendee if null
                v_payer_id := COALESCE(v_payer_id, p_attendee_id);

                select credit_cost into v_credit_cost from sessions where id = p_session_id;

                -- Refund PAYER
                if v_credit_cost is not null AND v_credit_cost > 0 then
                    update profiles set credits = credits + v_credit_cost where id = v_payer_id;
                end if;

                -- SOFT DELETE: Mark registration as cancelled instead of deleting
                UPDATE registrations 
                SET status = 'cancelled' 
                WHERE user_id = p_attendee_id AND session_id = p_session_id;

                return json_build_object('success', true, 'message', 'Cancellation successful. Credits refunded.', 'refund_amount', COALESCE(v_credit_cost, 0));
            end;
            $$;
        `);

        console.log('5. Updating cancel_session_and_refund_v2 RPC...');
        await client.query(`
            CREATE OR REPLACE FUNCTION public.cancel_session_and_refund_v2(
                p_attendee_id uuid,
                p_session_id bigint,
                p_refund_amount int
            )
            RETURNS json
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            declare
                v_payer_id uuid;
                v_registration_id bigint;
            begin
                -- 1. Find the registration
                SELECT id, payer_id
                INTO v_registration_id, v_payer_id
                FROM registrations
                WHERE user_id = p_attendee_id AND session_id = p_session_id AND status != 'cancelled';

                if v_registration_id is null then
                    return json_build_object('success', false, 'message', 'Active booking not found.');
                end if;

                -- Default payer to attendee if null (legacy)
                v_payer_id := COALESCE(v_payer_id, p_attendee_id);

                -- 2. Refund logic (if amount > 0)
                if p_refund_amount > 0 then
                    UPDATE profiles SET credits = credits + p_refund_amount WHERE id = v_payer_id;
                end if;

                -- 3. SOFT DELETE Registration
                UPDATE registrations SET status = 'cancelled' WHERE id = v_registration_id;

                return json_build_object(
                    'success', true,
                    'message', 'Cancellation successful.',
                    'refund_amount', p_refund_amount,
                    'refunded_to', v_payer_id
                );
            end;
            $$;
        `);

        console.log('✅ Migration complete!');

    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        client.release();
        await pool.end();
        console.log('--- MIGRATION FINISHED ---');
    }
}

migrate();
