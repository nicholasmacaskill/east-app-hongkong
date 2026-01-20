const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.resolve(__dirname, '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (e) {
  console.error("Warning: Could not read .env.local", e.message);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false }
});

const UPDATE_RPC_SQL = `
DROP FUNCTION IF EXISTS book_session_with_credits(uuid, bigint);

create or replace function book_session_with_credits(
  p_user_id uuid,
  p_session_id bigint,
  p_attendee_id uuid default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_credit_cost int;
  v_user_credits int;
begin
  select credit_cost into v_credit_cost from sessions where id = p_session_id;
  select credits into v_user_credits from profiles where id = p_user_id;

  if v_credit_cost is null then
    return json_build_object('success', false, 'message', 'Session cost not defined.');
  end if;

  if v_user_credits < v_credit_cost then
    return json_build_object('success', false, 'message', 'Insufficient credits.');
  end if;

  -- Update Parent Balance
  update profiles set credits = credits - v_credit_cost where id = p_user_id;
  
  -- Register Attendee (or Parent if null)
  insert into registrations (user_id, session_id) values (COALESCE(p_attendee_id, p_user_id), p_session_id);

  return json_build_object('success', true, 'message', 'Booking confirmed!', 'new_balance', v_user_credits - v_credit_cost);
end;
$$;
`;

(async () => {
  const client = await pool.connect();
  try {
    await client.query(UPDATE_RPC_SQL);
    console.log("✅ Updated booking function successfully.");
  } catch (e) {
    console.error("❌ Failed to update function:", e);
  } finally {
    client.release();
    await pool.end();
  }
})();
