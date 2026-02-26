-- Migration: Fix Master Booking Logic for Coach Profile Bookings
-- Problem: When booking an existing session from a coach profile (origin='coaches', coachId=null), 
-- the RPC skipped both costing and registration, leading to "Success" return with zero actual database changes.

CREATE OR REPLACE FUNCTION public.master_book_atomic(
  p_user_id UUID,
  p_session_id BIGINT,
  p_attendee_ids UUID[],
  p_coach_id UUID DEFAULT NULL,
  p_coach_tier TEXT DEFAULT 'junior',
  p_origin TEXT DEFAULT 'facilities'
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

  -- Total cost logic
  v_total_cost := 0;
  
  -- ALWAYS charge main session cost if we are booking into p_session_id.
  -- This happens if origin is facilities OR if we are joining an existing session from coach profile (coach_id is null/matching)
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

  -- 8. CHECK COACH AVAILABILITY (Only if creating a NEW private session)
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

    -- Fetch info
    SELECT first_name, last_name, avatar_url INTO v_coach_first_name, v_coach_last_name, v_coach_avatar
    FROM public.profiles WHERE id = p_coach_id;

    -- Create Private Session
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
    -- Book Facility / Existing Session
    IF p_origin = 'facilities' OR (p_origin = 'coaches' AND p_coach_id IS NULL) THEN
      INSERT INTO public.registrations (session_id, user_id, payer_id, credits_paid)
      VALUES (p_session_id, v_attendee_id, p_user_id, v_main_session_cost);
      
      v_results := v_results || jsonb_build_object('attendeeId', v_attendee_id, 'type', 'facility', 'success', true);
    END IF;

    -- Book Coach (New Private Session)
    IF v_coach_session_id IS NOT NULL THEN
      INSERT INTO public.registrations (session_id, user_id, payer_id, credits_paid)
      VALUES (v_coach_session_id, v_attendee_id, p_user_id, v_coach_cost);
      
      v_results := v_results || jsonb_build_object('attendeeId', v_attendee_id, 'type', 'coach', 'success', true);
    END IF;
  END LOOP;

  -- 10. DEDUCT TOTAL CREDITS
  UPDATE public.profiles 
  SET credits = credits - v_total_cost 
  WHERE id = p_user_id;

  -- 11. LOG TRANSACTION
  -- Ensure 'transactions' table exists
  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (p_user_id, -v_total_cost, 'booking', 'Booking for ' || v_main_session_title || ' (' || array_length(p_attendee_ids, 1) || ' attendees)');

  RETURN jsonb_build_object('success', true, 'message', 'Booking successful', 'results', v_results);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
