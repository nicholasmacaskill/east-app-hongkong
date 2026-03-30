const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function seedStagingDB() {
    console.log("Connecting to Staging DB to seed basic data...");
    
    // Connect to the new staging DB using the raw credentials provided
    const pool = new Pool({
        host: 'aws-1-us-east-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.lzqnviblkcnjsxutqeht',
        password: 'FNjB8Ca3Ar0Yg816mY%9'
    });

    try {
        console.log("Reading dummy data schema...");
        const seedPath = path.join(__dirname, '../project-docs/RESTORE_PRODUCTION_DATA.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');

        console.log("Injecting dummy data...");
        
        await pool.query(seedSql);
        
        console.log("✅ Success! The new Staging Database is now populated with dummy sessions and events.");
    } catch (error) {
        console.error("❌ Data Seeding Failed:", error);
    } finally {
        await pool.end();
    }
}

seedStagingDB();
