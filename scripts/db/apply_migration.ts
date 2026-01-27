import getDbPool from '../../app/lib/db';
import { Pool } from 'pg';

const migrationCommands = [
    // 1. Create player_relationships table
    `CREATE TABLE IF NOT EXISTS player_relationships (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        child_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        relationship_type VARCHAR(50) DEFAULT 'parent_child',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(parent_id, child_id)
    );`,

    // 2. Enable RLS on it
    `ALTER TABLE player_relationships ENABLE ROW LEVEL SECURITY;`,

    // 3. Add columns to profiles for managed accounts
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_managed BOOLEAN DEFAULT false;`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES auth.users(id);`,

    // 4. Update players_stats for verification
    `ALTER TABLE players_stats ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;`,
    `ALTER TABLE players_stats ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);`,
    `ALTER TABLE players_stats ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;`
];

async function runMigration(pool: Pool, sqlQuery: string) {
    const client = await pool.connect();
    try {
        await client.query(sqlQuery);
        console.log(`✅ Executed: ${sqlQuery.substring(0, 50)}...`);
    } catch (e) {
        console.error(`❌ Failed: ${sqlQuery.substring(0, 50)}...`, e);
    } finally {
        client.release();
    }
}

(async () => {
    console.log("Starting Safe Migration...");
    const pool = getDbPool();
    for (const cmd of migrationCommands) {
        await runMigration(pool, cmd);
    }
    await pool.end();
    console.log("Migration Complete.");
})();
