const { Pool } = require('pg');

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

const sql = `
DO $$ 
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_types_category_check') THEN
        ALTER TABLE public.session_types DROP CONSTRAINT session_types_category_check;
    END IF;

    -- Add the updated constraint
    ALTER TABLE public.session_types ADD CONSTRAINT session_types_category_check CHECK (category IN ('CLASS', 'PRIVATE', 'FACILITY'));
END $$;
`;

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("🚀 Running Production Migration via Pooler: Adding 'FACILITY' to session_types...");
        await client.query(sql);
        console.log("✅ Success: Production 'session_types' category check updated successfully.");
    } catch (e: any) {
        console.error("❌ Migration Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
