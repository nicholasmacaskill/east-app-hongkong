import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log("Connected to database. Creating teams tables...");

        await client.query(`
            CREATE TABLE IF NOT EXISTS teams (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS team_members (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
                user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(team_id, user_id)
            );

            -- Ensure messages table has team_id
            ALTER TABLE messages ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

            -- Realtime replica identity for teams and team_members
            ALTER TABLE teams REPLICA IDENTITY FULL;
            ALTER TABLE team_members REPLICA IDENTITY FULL;
        `);

        console.log("✅ Teams tables created successfully.");

        // We also need to reload the schema cache for PostgREST
        console.log("Reloading schema cache...");
        await client.query(`NOTIFY pgrst, 'reload schema'`);
        console.log("✅ Schema cache reloaded.");

    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
