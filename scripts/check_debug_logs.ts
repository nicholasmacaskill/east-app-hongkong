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
    ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
});

async function checkLogs() {
    console.log("🔍 Fetching recent Webhook Logs (Direct SQL)...");

    try {
        await client.connect();
        const res = await client.query('SELECT * FROM webhook_debug_logs ORDER BY created_at DESC LIMIT 5');

        if (res.rows.length === 0) {
            console.log("❌ NO LOGS FOUND. The webhook did not reach the server.");
        } else {
            console.log(`✅ Found ${res.rows.length} logs:`);
            res.rows.forEach(log => {
                console.log(`\n--- [${log.created_at}] ---`);
                console.log(`Event: ${log.event_type}`);
                console.log(`Status: ${log.status}`);
                if (log.error_message) console.log(`Error: ${log.error_message}`);
                // Safely log payload snippet
                let payloadStr = "";
                if (typeof log.payload === 'string') payloadStr = log.payload;
                else payloadStr = JSON.stringify(log.payload, null, 2);

                console.log(`Payload Snippet:`, payloadStr.substring(0, 300) + '...');
            });
        }
    } catch (err: any) {
        console.error("SQL Error:", err.message);
    } finally {
        await client.end();
    }
}

checkLogs();
