import { Client } from 'pg';

// Constructed from User Input
const HOSTStr = "aws-1-ap-southeast-1.pooler.supabase.com";
const PORT = 6543;
const USER = "postgres.ktlicvvczrlppqkcqedv";
const PASS = "Bucktooth5-Pastor3-Crumpet6-Dig1-Hurry8";
const DB = "postgres";

const VIDEO_URL = `postgresql://${USER}:${encodeURIComponent(PASS)}@${HOSTStr}:${PORT}/${DB}`;

const client = new Client({
    connectionString: VIDEO_URL,
    ssl: { rejectUnauthorized: false }
});

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS webhook_debug_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_type TEXT,
    payload JSONB,
    status TEXT,
    error_message TEXT
);

ALTER TABLE webhook_debug_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'webhook_debug_logs' AND policyname = 'Allow Service Role Full Access'
    ) THEN
        CREATE POLICY "Allow Service Role Full Access" ON webhook_debug_logs
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
`;

async function setupTable() {
    console.log("🚀 Creating Debug Table in PRODUCTION...");
    try {
        await client.connect();
        await client.query(CREATE_TABLE_SQL);
        console.log("✅ Table 'webhook_debug_logs' created successfully!");
    } catch (err: any) {
        console.error("SQL Error:", err.message);
    } finally {
        await client.end();
    }
}

setupTable();
