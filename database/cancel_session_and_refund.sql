-- =============================================
-- Function: Cancel Session & Refund
-- =============================================
-- Purpose: Cancel a registration and refund the EXACT amount paid
-- Logic: Looks up credits_paid from registration, refunds to payer_id

CREATE OR REPLACE FUNCTION cancel_session_and_refund(
  p_user_id uuid,
  p_session_id bigint
) RETURNS json AS $$
DECLARE
  v_credits_paid int;
  v_payer_id uuid;
  v_registration_id bigint;
BEGIN
  -- 1. Find the registration
  SELECT id, credits_paid, payer_id 
  INTO v_registration_id, v_credits_paid, v_payer_id
  FROM registrations
  WHERE user_id = p_user_id AND session_id = p_session_id;

  IF v_registration_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Registration not found');
  END IF;

  -- 2. Delete the registration
  DELETE FROM registrations WHERE id = v_registration_id;

  -- 3. Refund the payer (if amount > 0)
  IF v_credits_paid > 0 THEN
    UPDATE profiles 
    SET credits = credits + v_credits_paid 
    WHERE id = v_payer_id;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'message', 'Session cancelled and ' || v_credits_paid || ' credits refunded.',
    'refund_amount', v_credits_paid,
    'refunded_to', v_payer_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Cancellation failed: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
