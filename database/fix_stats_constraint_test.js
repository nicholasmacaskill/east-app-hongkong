const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

async function run() {
    // Some .env files might prefix the Postgres connection with NEXT_PUBLIC_ or simply have DATABASE_URL
    // We will find the correct connection string
    let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    // If not found, exit gracefully
    if (!connectionString) {
        console.error("❌ Error: No DATABASE_URL found in .env.test.latest");
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    console.log(`🔌 Connecting to Test Database...`);
    await client.connect();

    const sql = `
        ALTER TABLE public.players_stats 
        DROP CONSTRAINT IF EXISTS players_stats_player_id_category_key;

        ALTER TABLE public.players_stats 
        ADD CONSTRAINT players_stats_player_id_category_key UNIQUE (player_id, category);
    `;

    console.log(`🚀 Executing Constraint Migration...`);
    try {
        await client.query(sql);
        console.log(`✅ Unique constraint added successfully for player_id + category.`);
    } catch (e) {
        console.error(`❌ SQL Error:`, e.message);
    } finally {
        await client.end();
    }
}

run();
