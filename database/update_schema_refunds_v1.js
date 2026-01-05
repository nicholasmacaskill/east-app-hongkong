
const { Pool } = require('pg');

const getDbPool = () => {
    return new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '54322', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
    });
};

const updateFunctionSql = `
CREATE OR REPLACE FUNCTION "public"."cancel_session_and_refund"(
  "p_attendee_id" "uuid", 
  "p_session_id" bigint
) 
RETURNS json
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
declare
  v_credit_cost int;
  v_start_time timestamp with time zone;
  v_payer_id uuid;
  v_hours_until_start float;
  v_refund_amount int;
begin
  -- 1. Check registration & get Payer
  SELECT payer_id INTO v_payer_id 
  FROM registrations 
  WHERE user_id = p_attendee_id AND session_id = p_session_id;

  if not found then
    return json_build_object('success', false, 'message', 'Booking not found.');
  end if;

  -- Default payer to attendee if null (legacy bookings)
  v_payer_id := COALESCE(v_payer_id, p_attendee_id);

  -- 2. Get Session Cost & Time
  SELECT credit_cost, start_time INTO v_credit_cost, v_start_time 
  FROM sessions 
  WHERE id = p_session_id;

  if v_credit_cost is null then
     -- Non-credit session, just delete
    DELETE FROM registrations WHERE user_id = p_attendee_id AND session_id = p_session_id;
    return json_build_object('success', true, 'message', 'Cancellation confirmed.');
  end if;

  -- 3. Calculate Hours until start
  -- extract epoch returns seconds, divide by 3600 for hours
  v_hours_until_start := extract(epoch from (v_start_time - now())) / 3600;

  -- 4. Calculate Refund Amount based on Rules
  -- Rule A: > 48 hours = 100% Refund (Standard friendly policy, implicit)
  -- Rule B: 24 - 48 hours = 50% Refund
  -- Rule C: < 24 hours = 0% Refund

  if v_hours_until_start < 24 then
    v_refund_amount := 0;
  elsif v_hours_until_start < 48 then
    v_refund_amount := floor(v_credit_cost * 0.5);
  else
    v_refund_amount := v_credit_cost;
  end if;

  -- 5. Refund Logic
  if v_refund_amount > 0 then
    UPDATE profiles SET credits = credits + v_refund_amount WHERE id = v_payer_id;
  end if;

  -- 6. Cancel Registration
  DELETE FROM registrations WHERE user_id = p_attendee_id AND session_id = p_session_id;

  return json_build_object(
    'success', true, 
    'message', 'Cancellation successful.', 
    'refund_amount', v_refund_amount,
    'hours_until', v_hours_until_start
  );
end;
$$;
`;

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("🔄 Updating cancel_session_and_refund logic to V1 implementation...");
        await client.query(updateFunctionSql);
        console.log("✅ Success: Function updated.");
    } catch (e) {
        console.error("❌ Migration Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
