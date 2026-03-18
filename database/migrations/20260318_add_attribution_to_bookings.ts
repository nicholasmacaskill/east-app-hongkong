import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables manually for robustness
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
    console.error("Failed to load .env.local", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
    console.log('🔄 Adding booking attribution columns and updating RPCs...\n');

    const migration = `
        -- 1. Add created_by column to transactions and registrations
        ALTER TABLE public.transactions 
        ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

        ALTER TABLE public.registrations 
        ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

        -- 2. Update master_book_atomic to handle attribution
        CREATE OR REPLACE FUNCTION public.master_book_atomic(
          p_user_id UUID,
          p_session_id BIGINT,
          p_attendee_ids UUID[],
          p_coach_id UUID DEFAULT NULL,
          p_coach_tier TEXT DEFAULT 'junior',
          p_origin TEXT DEFAULT 'facilities',
          p_created_by UUID DEFAULT NULL
        ) RETURNS JSONB AS $$
        DECLARE
          v_main_session_start TIMESTAMPTZ;
          v_main_session_end TIMESTAMPTZ;
          v_main_session_title TEXT;
          v_main_session_cost INT;
          v_max_capacity INT;
          v_current_bookings INT;
          
          v_coach_first_name TEXT;
          v_coach_last_name TEXT;
          v_coach_avatar TEXT;
          v_coach_cost INT;
          v_coach_session_id BIGINT;
          
          v_total_cost INT;
          v_user_credits INT;
          v_user_sub_status TEXT;
          v_user_acc_status TEXT;
          v_parent_id UUID;
          
          v_attendee_id UUID;
          v_coach_available BOOLEAN;
          v_results JSONB := '[]'::JSONB;
        BEGIN
          -- 1. LOCK USER PROFILE
          SELECT 
            credits, subscription_status, account_status, parent_id 
          INTO 
            v_user_credits, v_user_sub_status, v_user_acc_status, v_parent_id
          FROM public.profiles 
          WHERE id = p_user_id 
          FOR UPDATE;

          IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'message', 'User profile not found');
          END IF;

          -- 2. HANDLE CHILD ACCOUNTS
          IF v_parent_id IS NOT NULL THEN
            SELECT 
              subscription_status, account_status 
            INTO 
              v_user_sub_status, v_user_acc_status
            FROM public.profiles 
            WHERE id = v_parent_id;
          END IF;

          -- 3. CHECK ACCOUNT STATUS
          IF v_user_sub_status NOT IN ('active', 'trialing') AND v_user_acc_status != 'active' THEN
            RETURN jsonb_build_object('success', false, 'message', 'Account Locked: Active subscription required', 'code', 'SUBSCRIPTION_LOCKED');
          END IF;

          -- 4. FETCH MAIN SESSION DATA
          SELECT 
            start_time, end_time, title, credit_cost, max_capacity 
          INTO 
            v_main_session_start, v_main_session_end, v_main_session_title, v_main_session_cost, v_max_capacity
          FROM public.sessions 
          WHERE id = p_session_id;

          IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'message', 'Main session not found');
          END IF;

          -- 5. CALCULATE TOTAL COSTS
          v_coach_cost := CASE 
            WHEN p_coach_tier = 'senior' THEN 850
            WHEN p_coach_tier = 'junior' THEN 500
            WHEN p_coach_tier = 'golf' THEN 1100
            WHEN p_coach_tier = 'pt' THEN 700
            WHEN p_coach_tier = 'hyrox' THEN 800
            ELSE 750
          END;

          v_total_cost := 0;
          
          IF p_origin = 'facilities' OR (p_origin = 'coaches' AND p_coach_id IS NULL) THEN
            v_total_cost := v_total_cost + (v_main_session_cost * array_length(p_attendee_ids, 1));
          END IF;
          
          IF p_coach_id IS NOT NULL THEN
            v_total_cost := v_total_cost + (v_coach_cost * array_length(p_attendee_ids, 1));
          END IF;

          -- 6. CHECK CREDITS
          IF v_user_credits < v_total_cost THEN
            RETURN jsonb_build_object('success', false, 'message', 'Insufficient credits. Required: ' || v_total_cost || ', Available: ' || v_user_credits, 'code', 'INSUFFICIENT_CREDITS');
          END IF;

          -- 7. CHECK CAPACITY
          SELECT count(*) INTO v_current_bookings FROM public.registrations WHERE session_id = p_session_id;
          IF v_current_bookings + array_length(p_attendee_ids, 1) > v_max_capacity THEN
            RETURN jsonb_build_object('success', false, 'message', 'Capacity met', 'code', 'CAPACITY_MET');
          END IF;

          -- 8. CHECK COACH AVAILABILITY
          IF p_coach_id IS NOT NULL THEN
            SELECT EXISTS (
              SELECT 1 FROM public.availability 
              WHERE coach_id = p_coach_id 
              AND start_time <= v_main_session_start 
              AND end_time >= v_main_session_end
            ) INTO v_coach_available;

            IF NOT v_coach_available THEN
              RETURN jsonb_build_object('success', false, 'message', 'Coach not available at this time');
            END IF;

            SELECT first_name, last_name, avatar_url INTO v_coach_first_name, v_coach_last_name, v_coach_avatar
            FROM public.profiles WHERE id = p_coach_id;

            INSERT INTO public.sessions (
              title, category, instructor, start_time, end_time, credit_cost, description, coach_image_url
            ) VALUES (
              'Private with ' || v_coach_first_name,
              'PRIVATE',
              TRIM(v_coach_first_name || ' ' || COALESCE(v_coach_last_name, '')),
              v_main_session_start,
              v_main_session_end,
              v_coach_cost,
              'Private coaching during ' || v_main_session_title,
              v_coach_avatar
            ) RETURNING id INTO v_coach_session_id;
          END IF;

          -- 9. EXECUTE BOOKINGS
          FOREACH v_attendee_id IN ARRAY p_attendee_ids LOOP
            IF p_origin = 'facilities' OR (p_origin = 'coaches' AND p_coach_id IS NULL) THEN
              INSERT INTO public.registrations (session_id, user_id, payer_id, credits_paid, created_by)
              VALUES (p_session_id, v_attendee_id, p_user_id, v_main_session_cost, p_created_by);
              
              v_results := v_results || jsonb_build_object('attendeeId', v_attendee_id, 'type', 'facility', 'success', true);
            END IF;

            IF v_coach_session_id IS NOT NULL THEN
              INSERT INTO public.registrations (session_id, user_id, payer_id, credits_paid, created_by)
              VALUES (v_coach_session_id, v_attendee_id, p_user_id, v_coach_cost, p_created_by);
              
              v_results := v_results || jsonb_build_object('attendeeId', v_attendee_id, 'type', 'coach', 'success', true);
            END IF;
          END LOOP;

          -- 10. DEDUCT TOTAL CREDITS
          UPDATE public.profiles 
          SET credits = credits - v_total_cost 
          WHERE id = p_user_id;

          -- 11. LOG TRANSACTION (NOW populating created_by)
          INSERT INTO public.transactions (user_id, amount, type, session_id, description, created_by)
          VALUES (p_user_id, -v_total_cost, 'booking', p_session_id, 'Booking for ' || v_main_session_title || ' (' || array_length(p_attendee_ids, 1) || ' attendees)', p_created_by);

          RETURN jsonb_build_object('success', true, 'message', 'Booking successful', 'results', v_results);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- 3. Update cancel_session_and_refund_v2 to handle attribution
        CREATE OR REPLACE FUNCTION "public"."cancel_session_and_refund_v2"(
          "p_attendee_id" "uuid",
          "p_session_id" bigint,
          "p_refund_amount" int,
          "p_created_by" uuid DEFAULT NULL
        )
        RETURNS json
        LANGUAGE "plpgsql" SECURITY DEFINER
        AS $$
        declare
          v_payer_id uuid;
          v_registration_id bigint;
          v_session_title text;
        begin
          -- 1. Find the registration and session title
          SELECT r.id, r.payer_id, s.title
          INTO v_registration_id, v_payer_id, v_session_title
          FROM registrations r
          JOIN sessions s ON s.id = r.session_id
          WHERE r.user_id = p_attendee_id AND r.session_id = p_session_id;

          if v_registration_id is null then
            return json_build_object('success', false, 'message', 'Booking not found.');
          end if;

          -- Default payer to attendee if null (legacy)
          v_payer_id := COALESCE(v_payer_id, p_attendee_id);

          -- 2. Refund logic (if amount > 0)
          if p_refund_amount > 0 then
            UPDATE profiles SET credits = credits + p_refund_amount WHERE id = v_payer_id;
            
            -- LOG TRANSACTION as 'refund' with created_by
            INSERT INTO public.transactions (user_id, amount, type, session_id, description, created_by)
            VALUES (v_payer_id, p_refund_amount, 'refund', p_session_id, 'Refund for cancelled booking: ' || v_session_title, p_created_by);
          else
            -- Still log the cancellation event with created_by
            INSERT INTO public.transactions (user_id, amount, type, session_id, description, created_by)
            VALUES (v_payer_id, 0, 'refund', p_session_id, 'Cancellation (No Refund): ' || v_session_title, p_created_by);
          end if;

          -- 3. Soft Delete Registration (Update status and created_by if needed)
          UPDATE registrations SET status = 'cancelled', created_by = COALESCE(p_created_by, created_by) WHERE id = v_registration_id;

          return json_build_object(
            'success', true,
            'message', 'Cancellation successful.',
            'refund_amount', p_refund_amount,
            'refunded_to', v_payer_id
          );

        EXCEPTION
          WHEN OTHERS THEN
            RETURN json_build_object('success', false, 'message', 'Cancellation failed: ' || SQLERRM);
        end;
        $$;
    `;

    console.log('📡 Sending migration to Supabase via run_sql...');
    const { data, error } = await supabase.rpc('run_sql', { sql_query: migration });

    if (error) {
        console.error('❌ RPC Error:', JSON.stringify(error, null, 2));
        console.log('\n📋 Please run this SQL manually in your Supabase SQL editor:\n');
        // console.log(migration); // Avoid printing full SQL if it's too long and hiding the error
        process.exit(1);
    }

    console.log('✅ Migration data:', data);
    console.log('✅ Migration completed successfully!\n');
}

runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Migration error:', err);
        process.exit(1);
    });
