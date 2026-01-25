-- =============================================
-- RPC Function: Atomic Coach Booking (Updated)
-- =============================================
-- Logs origin and credits_paid

DROP FUNCTION IF EXISTS book_coach_atomic(uuid, uuid, bigint, int, uuid, text);

CREATE OR REPLACE FUNCTION book_coach_atomic(
  p_user_id uuid,
  p_coach_id uuid,
  p_session_id bigint,
  p_credit_cost int,
  p_attendee_id uuid DEFAULT NULL,
  p_origin text DEFAULT 'facilities'
) RETURNS json AS $$
DECLARE
  v_user_credits int;
  v_new_balance int;
  v_final_attendee_id uuid;
BEGIN
  -- Use attendee_id if provided, otherwise book for the user themselves
  v_final_attendee_id := COALESCE(p_attendee_id, p_user_id);

  -- Lock the coach's availability row
  PERFORM * FROM availability 
  WHERE coach_id = p_coach_id 
  AND start_time <= (SELECT start_time FROM sessions WHERE id = p_session_id)
  AND end_time >= (SELECT end_time FROM sessions WHERE id = p_session_id)
  FOR UPDATE;
  
  -- Check user credits
  SELECT credits INTO v_user_credits FROM profiles WHERE id = p_user_id;
  
  IF v_user_credits < p_credit_cost THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Insufficient credits.',
      'current_balance', v_user_credits,
      'required', p_credit_cost
    );
  END IF;
  
  -- Deduct credits from payer
  UPDATE profiles 
  SET credits = credits - p_credit_cost 
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  -- Insert registration atomically
  -- ✅ STORES ACTUAL COST for refunds
  INSERT INTO registrations (user_id, session_id, payer_id, credits_paid)
  VALUES (v_final_attendee_id, p_session_id, p_user_id, p_credit_cost);
  
  -- Return success
  RETURN json_build_object(
    'success', true, 
    'message', 'Booking confirmed!',
    'new_balance', v_new_balance
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Booking failed: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
