
import * as dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

// Load .env.local from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function findRecentTestUsers() {
    console.log("🔍 Connecting to database...");

    // Prioritize DATABASE_URL as it uses the pooler which is resolving
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error("❌ DATABASE_URL is not defined in .env.local");
        return;
    }

    // Use connection string but disable SSL verification for local dev if needed, 
    // though Supabase usually requires SSL.
    const pool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Required for some Supabase connections
    });

    const client = await pool.connect();

    try {
        console.log("🔍 Querying for recent profiles...");
        const res = await client.query(`
            SELECT id, contact_email, first_name, last_name, credits, role, created_at 
            FROM public.profiles 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        if (res.rows.length === 0) {
            console.log("❌ No profiles found.");
        } else {
            console.log("✅ Recent profiles found:");
            console.table(res.rows.map(row => ({
                Email: row.contact_email,
                Name: `${row.first_name} ${row.last_name}`,
                Credits: row.credits,
                Role: row.role,
                Created: row.created_at
            })));
        }
    } catch (err) {
        console.error("❌ Error querying profiles:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

findRecentTestUsers();
