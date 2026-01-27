
const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

// Parse the connection string or build from individual vars
// Note: enable_rls_security.ts uses DB_HOST etc. but Supabase projects usually have direct connection strings in DATABASE_URL or POSTGRES_URL.
// Let's try to infer from what's available.
// If DATABASE_URL is present, use it.

const getDbConfig = () => {
    if (process.env.DATABASE_URL) {
        return { connectionString: process.env.DATABASE_URL };
    }
    if (process.env.POSTGRES_URL) {
        return { connectionString: process.env.POSTGRES_URL };
    }
    // Fallback to individual components if URL not found
    return {
        host: process.env.DB_HOST || 'db.cvwjgqrvz...supabase.co', // We don't know the default, relying on env
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
        database: process.env.DB_NAME || 'postgres',
    };
};

const pool = new Pool(getDbConfig());

async function runMigration() {
    console.log('Starting migration: add_session_status...');
    const client = await pool.connect();

    try {
        const sql = `
        DO $$ 
        BEGIN 
          -- Add 'status' column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'status') THEN
            ALTER TABLE "public"."sessions" ADD COLUMN "status" text DEFAULT 'active';
            RAISE NOTICE 'Added status column to sessions table.';
          ELSE
            RAISE NOTICE 'Column status already exists in sessions table.';
          END IF;

          -- Create/Update index for performance
          CREATE INDEX IF NOT EXISTS idx_sessions_status ON "public"."sessions" ("status");
          RAISE NOTICE 'Ensured index on status column.';
          
        END $$;
      `;

        await client.query(sql);
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
