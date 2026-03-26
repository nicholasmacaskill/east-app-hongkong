import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Migration: Fix Membership Enforcement (Booking Loophole)');

  const sql = `
-- 1. Update increment_credits to remove automatic account activation
CREATE OR REPLACE FUNCTION public.increment_credits(p_user_id UUID, p_amount INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        credits = COALESCE(credits, 0) + p_amount
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update master_book_atomic to enforce strict membership checks
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
  v_membership_expires TIMESTAMPTZ;
  v_parent_id UUID;
  
  v_attendee_id UUID;
  v_coach_available BOOLEAN;
  v_results JSONB := '[]'::JSONB;
BEGIN
  -- 1. LOCK USER PROFILE
  SELECT 
    credits, subscription_status, account_status, membership_expires, parent_id 
  INTO 
    v_user_credits, v_user_sub_status, v_user_acc_status, v_membership_expires, v_parent_id
  FROM public.profiles 
  WHERE id = p_user_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'User profile not found');
  END IF;

  -- 2. HANDLE CHILD ACCOUNTS (Fetch membership from parent)
  IF v_parent_id IS NOT NULL THEN
    SELECT 
      subscription_status, account_status, membership_expires
    INTO 
      v_user_sub_status, v_user_acc_status, v_membership_expires
    FROM public.profiles 
    WHERE id = v_parent_id;
  END IF;

  -- 3. CHECK ACCOUNT STATUS (ENFORCED MEMBERSHIP)
  -- A user is active if they have an 'active'/'trialing' Stripe subscription
  -- OR if they have a manual membership expiry date in the future.
  IF (v_user_sub_status IS NULL OR v_user_sub_status NOT IN ('active', 'trialing'))
     AND (v_membership_expires IS NULL OR v_membership_expires < NOW()) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Account Locked: Active membership required to book. Please purchase a membership or contact support.', 
      'code', 'SUBSCRIPTION_LOCKED'
    );
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
  SELECT count(*) INTO v_current_bookings FROM public.registrations WHERE session_id = p_session_id AND status != 'cancelled';
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

  -- 11. LOG TRANSACTION
  INSERT INTO public.transactions (user_id, amount, type, session_id, description, created_by)
  VALUES (p_user_id, -v_total_cost, 'booking', p_session_id, 'Booking for ' || v_main_session_title || ' (' || array_length(p_attendee_ids, 1) || ' attendees)', p_created_by);

  RETURN jsonb_build_object('success', true, 'message', 'Booking successful', 'results', v_results);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

  const { error } = await supabase.rpc('run_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Migration Failed:', error);
  } else {
    console.log('✅ Success: increment_credits and master_book_atomic updated.');
  }
}

runMigration();
