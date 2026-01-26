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
begin
  -- 1. Find the registration
  SELECT id, payer_id
  INTO v_registration_id, v_payer_id
  FROM registrations
  WHERE user_id = p_attendee_id AND session_id = p_session_id;

  if v_registration_id is null then
    return json_build_object('success', false, 'message', 'Booking not found.');
  end if;

  -- Default payer to attendee if null (legacy)
  v_payer_id := COALESCE(v_payer_id, p_attendee_id);

  -- 2. Refund logic (if amount > 0)
  if p_refund_amount > 0 then
    UPDATE profiles SET credits = credits + p_refund_amount WHERE id = v_payer_id;
  end if;

  -- 3. Delete Registration
  DELETE FROM registrations WHERE id = v_registration_id;

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

GRANT ALL ON FUNCTION "public"."cancel_session_and_refund_v2"("uuid", bigint, int) TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_session_and_refund_v2"("uuid", bigint, int) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_session_and_refund_v2"("uuid", bigint, int) TO "service_role";

-- Force schema reload
NOTIFY pgrst, 'reload config';
