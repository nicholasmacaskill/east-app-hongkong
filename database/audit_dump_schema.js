const { Pool } = require('pg');
const fs = require('fs');

const getDbPool = () => {
    return new Pool({
        host: 'aws-0-us-west-2.pooler.supabase.com',
        port: 6543,
        user: 'postgres.hxbsnplotkiohcbmvsjf',
        password: 'Uninsured5-Unissued6-Happier7-Dripping1-Bubbling8',
        database: 'postgres',
        ssl: {
            rejectUnauthorized: false
        }
    });
};

async function dumpSchema() {
    const pool = getDbPool();
    const client = await pool.connect();
    const schema = {};
    try {
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);

        for (const row of tablesRes.rows) {
            const tableName = row.table_name;
            schema[tableName] = { columns: [], constraints: [] };

            const colsRes = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);
            schema[tableName].columns = colsRes.rows;

            const constraintsRes = await client.query(`
                SELECT tc.constraint_name, tc.constraint_type, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name, cc.check_clause
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
                LEFT JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
                LEFT JOIN information_schema.check_constraints AS cc ON cc.constraint_name = tc.constraint_name AND cc.constraint_schema = tc.table_schema
                WHERE tc.table_schema = 'public' AND tc.table_name = $1
            `, [tableName]);
            schema[tableName].constraints = constraintsRes.rows;
        }

        fs.writeFileSync('database_schema.json', JSON.stringify(schema, null, 2));
        console.log("✅ Schema dumped to database_schema.json");

    } catch (e) {
        console.error("❌ Schema Dump Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

dumpSchema();
