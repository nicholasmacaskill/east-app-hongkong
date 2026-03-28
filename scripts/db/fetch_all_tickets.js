
const { Pool } = require('pg');

// Verified connection string from earlier successful runs
const connectionString = 'postgresql://postgres:Oak7-Gloomily7-Nearness5-Friction9-Shell3@db.ktlicvvczrlppqkcqedv.supabase.co:5432/postgres';

async function fetchTickets() {
    console.log("🚀 Fetching all engineering tickets from Production...");
    
    const pool = new Pool({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        const res = await pool.query('SELECT * FROM public.engineering_tickets ORDER BY id ASC');
        console.log("Found Tickets:");
        console.table(res.rows.map(t => ({ id: t.id, title: t.title, status: t.status })));
    } catch (error) {
        console.error("❌ Fetch Failed:", error);
    } finally {
        await pool.end();
    }
}

fetchTickets();
