import getDbPool from './app/lib/db';

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log('🔍 Checking profiles table constraints...\n');

        const { rows } = await client.query(`
            SELECT
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'profiles' AND tc.constraint_type = 'FOREIGN KEY'
        `);

        console.log('Foreign key constraints on profiles table:');
        rows.forEach(row => {
            console.log(`\n- ${row.constraint_name}`);
            console.log(`  Column: ${row.column_name}`);
            console.log(`  References: ${row.foreign_table_name}.${row.foreign_column_name}`);
        });

    } catch (err: any) {
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
