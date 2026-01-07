-- =============================================
-- RPC Function: Transfer Credits Between Users
-- =============================================
-- Purpose: Allow parents to transfer credits to their children
-- Security: Verifies parent_id relationship before transfer

CREATE OR REPLACE FUNCTION transfer_credits(
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_amount int
) RETURNS json AS $$
DECLARE
  v_from_credits int;
  v_to_credits int;
  v_parent_id uuid;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Transfer amount must be positive'
    );
  END IF;

  -- Get sender's current balance
  SELECT credits INTO v_from_credits 
  FROM profiles 
  WHERE id = p_from_user_id;

  IF v_from_credits IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Sender not found'
    );
  END IF;

  -- Check sufficient balance
  IF v_from_credits < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Insufficient credits',
      'available', v_from_credits,
      'requested', p_amount
    );
  END IF;

  -- Verify recipient exists and get their parent_id
  SELECT credits, parent_id INTO v_to_credits, v_parent_id
  FROM profiles 
  WHERE id = p_to_user_id;

  IF v_to_credits IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Recipient not found'
    );
  END IF;

  -- Security check: Verify parent owns child
  IF v_parent_id != p_from_user_id THEN
    RETURN json_build_object(
      'success', false,
      'message', 'You can only transfer credits to your own children'
    );
  END IF;

  -- Execute transfer atomically
  UPDATE profiles 
  SET credits = credits - p_amount 
  WHERE id = p_from_user_id;

  UPDATE profiles 
  SET credits = credits + p_amount 
  WHERE id = p_to_user_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Transfer successful',
    'amount', p_amount,
    'new_sender_balance', v_from_credits - p_amount,
    'new_recipient_balance', v_to_credits + p_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Transfer failed: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION transfer_credits TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_credits TO service_role;
