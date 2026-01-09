-- Update book_session_with_credits to check for active subscription
-- If subscription is not 'active' or 'trialing', credits are locked.

CREATE OR REPLACE FUNCTION "public"."book_session_with_credits"("p_user_id" "uuid", "p_session_id" bigint, "p_attendee_id" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_credit_cost int;
  v_user_credits int;
  v_sub_status text;
begin
  select credit_cost into v_credit_cost from sessions where id = p_session_id;
  select credits, subscription_status into v_user_credits, v_sub_status from profiles where id = p_user_id;

  if v_credit_cost is null then
    return json_build_object('success', false, 'message', 'Session cost not defined.');
  end if;

  -- DORMANCY CHECK
  if v_sub_status IS NULL OR (v_sub_status != 'active' AND v_sub_status != 'trialing') then
     return json_build_object('success', false, 'message', 'Membership dormant. Renew to unlock credits.');
  end if;

  if v_user_credits < v_credit_cost then
    return json_build_object('success', false, 'message', 'Insufficient credits.');
  end if;

  update profiles set credits = credits - v_credit_cost where id = p_user_id;
  
  -- Use attendee_id if provided, otherwise user_id
  insert into registrations (user_id, session_id, payer_id) values (COALESCE(p_attendee_id, p_user_id), p_session_id, p_user_id);

  return json_build_object('success', true, 'message', 'Booking confirmed!', 'new_balance', v_user_credits - v_credit_cost);
end;
$$;
