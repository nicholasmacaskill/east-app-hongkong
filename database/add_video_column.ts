import getDbPool from '../app/lib/db';

const sql = `
  ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS intro_video_url TEXT;
`;

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        await client.query(sql);
        console.log("✅ Successfully added 'intro_video_url' column to profiles table.");
    } catch (e) {
        console.error("❌ Failed to add column:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
