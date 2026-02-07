-- 1. Add session_id to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS session_id bigint REFERENCES public.sessions(id) ON DELETE SET NULL;

-- 2. Update cancel_session_and_refund_v2 to log the transaction
CREATE OR REPLACE FUNCTION "public"."cancel_session_and_refund_v2"(
  "p_attendee_id" "uuid",
  "p_session_id" bigint,
  "p_refund_amount" int
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
    
    -- LOG TRANSACTION as 'refund'
    INSERT INTO public.transactions (user_id, amount, type, session_id, description)
    VALUES (v_payer_id, p_refund_amount, 'refund', p_session_id, 'Refund for cancelled booking: ' || v_session_title);
  else
    -- Still log the cancellation event even if 0 refund (late cancellation)
    INSERT INTO public.transactions (user_id, amount, type, session_id, description)
    VALUES (v_payer_id, 0, 'refund', p_session_id, 'Cancellation (No Refund): ' || v_session_title);
  end if;

  -- 3. Delete Registration
  -- Note: The implementation requirement says visibility should be maintained, 
  -- but our current logic markers rely on status = 'cancelled'.
  -- However, registrations are physically deleted in this RPC.
  -- TO MAINTAIN VISIBILITY, we should UPDATE status to 'cancelled' instead of DELETE.
  
  UPDATE registrations SET status = 'cancelled' WHERE id = v_registration_id;
  -- DELETE FROM registrations WHERE id = v_registration_id; -- Replaced with soft delete

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
