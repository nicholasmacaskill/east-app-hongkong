import getDbPool from '../../app/lib/db';
import fs from 'fs';
import path from 'path';

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        const sqlPath = path.join(process.cwd(), 'database/transfer_credits.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log("🚀 Deploying transfer_credits function...");
        await client.query(sqlContent);
        console.log("✅ Successfully deployed transfer_credits function!");

    } catch (e) {
        console.error("❌ Failed to deploy function:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
