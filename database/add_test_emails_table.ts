
import getDbPool from '../app/lib/db';
import { Pool } from 'pg';

const sql = `
-- Create test_emails table for headless verification
CREATE TABLE IF NOT EXISTS public.test_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_address TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT,
    trigger_source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (though only supabaseAdmin will write to it)
ALTER TABLE public.test_emails ENABLE ROW LEVEL SECURITY;

-- Allow service_role (Admin) full access
DROP POLICY IF EXISTS "Allow service_role full access on test_emails" ON public.test_emails;
CREATE POLICY "Allow service_role full access on test_emails" 
ON public.test_emails 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
`;

async function runSql(pool: Pool, sqlQuery: string) {
    const client = await pool.connect();
    try {
        await client.query(sqlQuery);
        console.log("✅ Successfully created test_emails table");
    } catch (e) {
        console.error("❌ Failed to create test_emails table", e);
        process.exit(1);
    } finally {
        client.release();
    }
}

(async () => {
    const pool = getDbPool();
    await runSql(pool, sql);
    await pool.end();
})();
