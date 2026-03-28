
import getDbPool from '../../app/lib/db';
import fs from 'fs';
import path from 'path';

async function applyTicket10Fix() {
    const sqlPath = path.join(__dirname, '../../database/migrations/20260327_ticket_10_fix.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("🚀 Applying Ticket #10 Identity Sync Trigger to Database...");
    
    const pool = getDbPool();
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        // Split by semicolons for cleaner execution if needed, but pg can handle blocks
        await client.query(sql);
        await client.query('COMMIT');
        console.log("✅ Migration Successful: Identity Sync Trigger and Ticket Columns added.");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Migration Failed:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

applyTicket10Fix();
