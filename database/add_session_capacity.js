
const { Client } = require('pg');

// Clear any conflicting env vars
['PGUSER', 'PGPASSWORD', 'PGHOST', 'PGPORT', 'PGDATABASE', 'DATABASE_URL'].forEach(e => delete process.env[e]);

const client = new Client({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `
-- Add max_capacity column to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 12;

-- Add constraint to ensure capacity is positive
ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_max_capacity_positive 
CHECK (max_capacity > 0);

-- Update the booking function to check capacity before booking
CREATE OR REPLACE FUNCTION public.book_session_with_credits(
  p_user_id uuid,
  p_session_id bigint,
  p_attendee_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credit_cost int;
  v_user_credits int;
  v_attendee_id uuid;
  v_max_capacity int;
  v_current_bookings int;
BEGIN
  -- Determine attendee (default to payer if null)
  v_attendee_id := COALESCE(p_attendee_id, p_user_id);

  -- Check if already registered
  IF EXISTS (SELECT 1 FROM registrations WHERE user_id = v_attendee_id AND session_id = p_session_id) THEN
    RETURN json_build_object('success', false, 'message', 'Attendee is already registered.');
  END IF;

  -- Get session capacity and current bookings
  SELECT max_capacity INTO v_max_capacity 
  FROM sessions 
  WHERE id = p_session_id;

  SELECT COUNT(*) INTO v_current_bookings 
  FROM registrations 
  WHERE session_id = p_session_id;

  -- Check capacity
  IF v_max_capacity IS NOT NULL AND v_current_bookings >= v_max_capacity THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Session is full. Please choose another time slot.',
      'current_bookings', v_current_bookings,
      'max_capacity', v_max_capacity
    );
  END IF;

  -- Get cost and credits
  SELECT credit_cost INTO v_credit_cost FROM sessions WHERE id = p_session_id;
  SELECT credits INTO v_user_credits FROM profiles WHERE id = p_user_id;

  IF v_credit_cost IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Session cost not defined.');
  END IF;

  IF v_user_credits < v_credit_cost THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient credits.');
  END IF;

  -- Deduct from PAYER
  UPDATE profiles SET credits = credits - v_credit_cost WHERE id = p_user_id;
  
  -- Insert with payer_id
  INSERT INTO registrations (user_id, session_id, payer_id) 
  VALUES (v_attendee_id, p_session_id, p_user_id);

  RETURN json_build_object(
    'success', true, 
    'message', 'Booking confirmed!', 
    'new_balance', v_user_credits - v_credit_cost
  );
END;
$$;
`;

async function main() {
  try {
    console.log("🔌 Connecting to Supabase...");
    await client.connect();
    console.log("📊 Adding max_capacity column and updating booking function...");
    await client.query(sql);
    console.log("✅ Successfully added session capacity constraints!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
