import getDbPool from '../app/lib/db';
import fs from 'fs';
import path from 'path';

async function restoreCoreTables() {
    console.log('🔄 Restoring core tables from schema.sql...');

    const pool = getDbPool();
    const client = await pool.connect();

    try {
        const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // We use a simplified strategy: Read the file and execute CREATE TABLE IF NOT EXISTS blocks.
        // For absolute safety in this environment, we will pick the most critical ones first.

        const tablesToEnsure = [
            'profiles',
            'sessions',
            'registrations',
            'availability',
            'players_stats',
            'posts',
            'likes',
            'messages',
            'player_relationships',
            'voice_commands'
        ];

        for (const tableName of tablesToEnsure) {
            console.log(`Ensuring table: ${tableName}...`);
            // Regex to find the CREATE TABLE block for this table
            const regex = new RegExp(`CREATE TABLE IF NOT EXISTS "public"\\."${tableName}"[\\s\\S]*?\\);`, 'i');
            const match = schemaSql.match(regex);

            if (match) {
                await client.query(match[0]);
                console.log(`✅ Table ${tableName} verified/created.`);
            } else {
                console.warn(`⚠️ Could not find CREATE TABLE block for ${tableName} in schema.sql`);
            }
        }

        console.log('✅ Core tables restoration complete.');

    } catch (err) {
        console.error('❌ Restoration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

restoreCoreTables();
