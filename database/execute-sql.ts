
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

async function executeSqlFile(filePath) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error("❌ Error: No DATABASE_URL or POSTGRES_URL found in .env.local");
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log(`🔌 Connecting to database...`);
        await client.connect();

        const fullPath = path.resolve(process.cwd(), filePath);
        console.log(`📖 Reading SQL file: ${filePath}`);
        const sql = fs.readFileSync(fullPath, 'utf8');

        console.log(`🚀 Executing SQL...`);
        await client.query(sql);
        console.log(`✅ SQL executed successfully!`);
    } catch (error) {
        console.error("❌ Database Error:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

const fileArg = process.argv[2];
if (!fileArg) {
    console.error("❌ Usage: npx ts-node database/execute-sql.ts <path-to-sql-file>");
    process.exit(1);
}

executeSqlFile(fileArg);
