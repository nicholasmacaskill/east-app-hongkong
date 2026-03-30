const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function initStagingDB() {
    console.log("Connecting to the new Staging Database...");
    
    // Connect to the new staging DB using the raw credentials provided
    const pool = new Pool({
        host: 'aws-1-us-east-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.lzqnviblkcnjsxutqeht',
        password: 'FNjB8Ca3Ar0Yg816mY%9'
    });

    try {
        console.log("Reading current schema...");
        const schemaPath = path.join(__dirname, 'current_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Executing schema in the new Staging database. This creates all your tables...");
        
        await pool.query(schemaSql);
        
        console.log("✅ Success! The new Staging Database is now structurally identical to Production.");
    } catch (error) {
        console.error("❌ Schema Initialization Failed:", error);
    } finally {
        await pool.end();
    }
}

initStagingDB();
