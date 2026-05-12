import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('Missing DATABASE_URL in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function findCoachWithDrills() {
    try {
        await client.connect();
        console.log('--- Searching for Coach with Drills ---');

        const sql = `
            SELECT 
                p.email, 
                p.first_name, 
                p.last_name, 
                p.role,
                COUNT(d.id) as drill_count
            FROM public.coach_drills d
            JOIN public.profiles p ON d.coach_id = p.id
            GROUP BY p.email, p.first_name, p.last_name, p.role
            ORDER BY drill_count DESC;
        `;

        const res = await client.query(sql);
        
        if (res.rows.length === 0) {
            console.log('No drills found in the database.');
        } else {
            console.table(res.rows);
        }

    } catch (e) {
        console.error('❌ Query failed:', e);
    } finally {
        await client.end();
    }
}

findCoachWithDrills();
