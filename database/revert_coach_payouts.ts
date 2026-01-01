
import getDbPool from '../app/lib/db';

const sql = `
  -- Revert Changes
  DROP TABLE IF EXISTS coach_earnings;
  
  ALTER TABLE profiles 
  DROP COLUMN IF EXISTS stripe_connect_id;

  -- Just in case the session payout script partially ran
  ALTER TABLE sessions
  DROP COLUMN IF EXISTS coach_id;
`;

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("🚀 Reverting Coach Payouts Migration...");
        await client.query(sql);
        console.log("✅ Successfully dropped 'coach_earnings' and removed columns.");
    } catch (e) {
        console.error("❌ Failed to revert migration:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
