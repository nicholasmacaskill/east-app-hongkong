import getDbPool from './app/lib/db';

const REPAIR_RPC_SQL = `
-- Drop ALL potential variations to ensure clean slate
DROP FUNCTION IF EXISTS book_session_with_credits(uuid, bigint);
DROP FUNCTION IF EXISTS book_session_with_credits(uuid, bigint, uuid);

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
  v_new_balance int;
begin
  -- 1. Get Cost
  select credit_cost into v_credit_cost from sessions where id = p_session_id;
  
  -- Default to 10 if not set (prevent free booking loophole)
  if v_credit_cost is null then
    v_credit_cost := 10;
  end if;

  -- 2. Get User Credits
  select credits into v_user_credits from profiles where id = p_user_id;
  
  if v_user_credits is null then
     v_user_credits := 0;
  end if;

  -- 3. Check Balance
  if v_user_credits < v_credit_cost then
    return json_build_object(
      'success', false, 
      'message', 'Insufficient credits. Cost: ' || v_credit_cost || ', Balance: ' || v_user_credits,
      'code', 'INSUFFICIENT_CREDITS'
    );
  end if;

  -- 4. Deduct Credits (Atomic Update)
  update profiles 
  set credits = credits - v_credit_cost 
  where id = p_user_id
  returning credits into v_new_balance;

  -- 5. Create Registration
  insert into registrations (user_id, session_id) 
  values (COALESCE(p_attendee_id, p_user_id), p_session_id);

  return json_build_object(
    'success', true, 
    'message', 'Booking confirmed!', 
    'deducted', v_credit_cost,
    'new_balance', v_new_balance
  );
end;
$$;
`;

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("🛠️ Repairing 'book_session_with_credits' RPC...");
        await client.query(REPAIR_RPC_SQL);
        console.log("✅ RPC Function successfully patched & credit logic enforced.");
    } catch (e) {
        console.error("❌ Failed to patch function:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
