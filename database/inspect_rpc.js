
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkRPC() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query("SELECT prosrc FROM pg_proc WHERE proname = 'cancel_session_and_refund_v2'");
        if (res.rows.length > 0) {
            console.log(res.rows[0].prosrc);
        } else {
            console.log('RPC not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkRPC();
