// @ts-nocheck
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
    const envPath = path.resolve(process.cwd(), file);
    const result = {};
    if (!fs.existsSync(envPath)) return result;
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const eqIdx = line.indexOf('=');
        if (eqIdx < 1) return;
        const key = line.slice(0, eqIdx).trim();
        const value = line.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
        if (key && !key.startsWith('#')) result[key] = value;
    });
    return result;
}

const env = loadEnv('.env.test.latest');
const sql = fs.readFileSync('database/migrations/20260420_shop_items_read.sql', 'utf8');

const client = new Client({
    connectionString: env['DATABASE_URL'],
    ssl: { rejectUnauthorized: false }
});

async function run() {
    console.log('🔌 Connecting to test DB...');
    await client.connect();
    console.log('🚀 Running shop_items_read migration...');
    await client.query(sql);
    console.log('✅ Migration complete — read policy added.');
    await client.end();
}

run().catch(async (e) => {
    console.error('❌ Migration failed:', e.message);
    await client.end();
    process.exit(1);
});
