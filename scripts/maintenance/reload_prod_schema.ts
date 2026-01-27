import { Client } from 'pg';

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

async function reloadSchema() {
    console.log("🚀 Reloading Schema Cache on PROD...");
    try {
        await client.connect();
        await client.query("NOTIFY pgrst, 'reload config'");
        console.log("✅ NOTIFY sent!");
    } catch (err: any) {
        console.error("SQL Error:", err.message);
    } finally {
        await client.end();
    }
}

reloadSchema();
