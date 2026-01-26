
const { Client } = require('pg');

// Clear any conflicting env vars
['PGUSER', 'PGPASSWORD', 'PGHOST', 'PGPORT', 'PGDATABASE', 'DATABASE_URL'].forEach(e => delete process.env[e]);

// Use the same format as DATABASE_URL in .env.local (port 5432, not 6543)
const client = new Client({
    connectionString: 'postgresql://postgres.ktlicvvczrlppqkcqedv:J0YqJq1EnDuyEF6X@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

const sql = `
CREATE TABLE IF NOT EXISTS public.test_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_address TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT,
    trigger_source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.test_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service_role full access on test_emails" ON public.test_emails;
CREATE POLICY "Allow service_role full access on test_emails" 
ON public.test_emails 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
`;

async function main() {
    try {
        console.log("🔌 Connecting to Supabase (port 5432)...");
        await client.connect();
        console.log("📧 Creating test_emails table...");
        await client.query(sql);
        console.log("✅ Successfully created test_emails table!");
    } catch (err) {
        console.error("❌ Error:", err.message);
        console.error("Full error:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
