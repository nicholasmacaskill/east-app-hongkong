// Verify players_stats table structure
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verifySchema() {
    console.log('Verifying players_stats table structure...\n');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        // Check columns
        const { rows } = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'players_stats'
            ORDER BY ordinal_position;
        `);

        console.log('Columns in players_stats table:');
        rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
        });

        // Check indexes
        const { rows: indexes } = await pool.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'players_stats';
        `);

        console.log('\nIndexes:');
        indexes.forEach(idx => {
            console.log(`  - ${idx.indexname}`);
        });

        console.log('\n✅ Schema verification complete!');
    } catch (error) {
        console.error('Verification failed:', error.message);
    } finally {
        await pool.end();
    }
}

verifySchema();
