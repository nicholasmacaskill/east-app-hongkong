
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Verified connection string from .env.local
const connectionString = 'postgresql://postgres:Oak7-Gloomily7-Nearness5-Friction9-Shell3@db.ktlicvvczrlppqkcqedv.supabase.co:5432/postgres';

async function applyTicket10Fix() {
    const sqlPath = path.join(__dirname, '../../database/migrations/20260327_ticket_10_fix.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("🚀 Applying Ticket #10 Identity Sync Trigger to Production Database...");
    
    const pool = new Pool({ 
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase direct connection
    });
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
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
