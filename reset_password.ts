const getDbPool = require('./app/lib/db.ts').default;
import { Pool } from 'pg';

// CONFIGURATION
const TARGET_EMAIL = 'lee@east.com'; // The email you use to log in
const NEW_PASSWORD = 'password123';  // The new password you want

const resetCommand = `
  UPDATE auth.users
  SET encrypted_password = crypt('${NEW_PASSWORD}', gen_salt('bf'))
  WHERE email = '${TARGET_EMAIL}';
`;

async function runReset(pool: Pool) {
    const client = await pool.connect();
    try { 
        console.log(`🔌 Connecting to database...`);
        
        // 1. Ensure encryption extension is enabled
        await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
        
        // 2. Force update the password
        const res = await client.query(resetCommand);
        
        if (res.rowCount && res.rowCount > 0) {
            console.log(`✅ SUCCESS!`);
            console.log(`User: ${TARGET_EMAIL}`);
            console.log(`New Password: ${NEW_PASSWORD}`);
        } else {
            console.error(`❌ ERROR: User not found.`);
            console.log(`Please ensure '${TARGET_EMAIL}' actually exists in your Supabase 'Authentication' tab.`);
        }
    } 
    catch (e) { console.error("❌ Database Error:", e); } 
    finally { client.release(); }
}

(async () => {
    const pool = getDbPool();
    await runReset(pool);
    await pool.end();
})();