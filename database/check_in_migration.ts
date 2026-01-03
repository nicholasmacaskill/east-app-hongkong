
const { Pool } = require('pg');

const getDbPool = () => {
    return new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '54322'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
    });
};

const sql = `
  CREATE TABLE IF NOT EXISTS public.check_ins (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id text NOT NULL,
    created_at timestamptz DEFAULT now()
  );

  -- RLS
  ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

  DO $$ 
  BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'check_ins' AND policyname = 'Users can view their own check-ins'
    ) THEN
        CREATE POLICY "Users can view their own check-ins"
        ON public.check_ins FOR SELECT
        USING (auth.uid() = user_id);
    END IF;
  END
  $$;
  
  GRANT ALL ON TABLE public.check_ins TO service_role;
  GRANT SELECT ON TABLE public.check_ins TO authenticated;
`;

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("🚀 Running Migration: Create check_ins table...");
        await client.query(sql);
        console.log("✅ Success: Table created and policies set.");
    } catch (e) {
        console.error("❌ Migration Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
