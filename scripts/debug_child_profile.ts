import getDbPool from '../app/lib/db';

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log("🔍 Checking for child profiles...\n");

        // 1. Check profiles table for children
        const { rows: childProfiles } = await client.query(`
            SELECT id, first_name, last_name, role, parent_id, subscription_status 
            FROM profiles 
            WHERE role = 'player' 
            LIMIT 5
        `);

        console.log("📋 Child Profiles in 'profiles' table:");
        console.table(childProfiles);

        // 2. Check if there's a separate 'players' table
        const { rows: tables } = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%player%'
        `);

        console.log("\n📊 Player-related tables:");
        console.table(tables);

        // 3. If players table exists, check it
        if (tables.some(t => t.table_name === 'players')) {
            const { rows: playersData } = await client.query(`
                SELECT * FROM players LIMIT 5
            `);
            console.log("\n👤 Data in 'players' table:");
            console.table(playersData);
        }

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
