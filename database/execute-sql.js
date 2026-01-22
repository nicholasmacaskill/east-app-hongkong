
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
    let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
        // Try to construct it from Supabase URL if possible
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const dbPassword = process.env.SUPABASE_DB_PASSWORD;
        if (supabaseUrl && supabaseUrl.includes('supabase.co') && dbPassword) {
            const projectRef = supabaseUrl.split('//')[1].split('.')[0];
            connectionString = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;
            console.log("🔗 Constructed connection string from Project Ref and Password.");
        } else {
            console.error("❌ Error: No direct DATABASE_URL found and DB Password missing.");
            process.exit(1);
        }
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
    console.error("❌ Usage: node database/execute-sql.js <path-to-sql-file>");
    process.exit(1);
}

executeSqlFile(fileArg);
