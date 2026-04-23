const { Client } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.production' });

async function runLiveMigration() {
    const rawUrl = process.env.DATABASE_URL;
    const match = rawUrl.match(/postgres:(.+?)@db\.(.+?)\.supabase\.co/);
    if (!match) throw new Error("Could not parse DATABASE_URL");
    const password = match[1].replace(/^\[|\]$/g, ''); // Explicitly removing square brackets
    const projectId = match[2];

    const poolerUrl = `postgresql://postgres.${projectId}:${password}@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`;
    console.log("Connecting using resolved pooler URL...", poolerUrl.replace(password, '***'));

    const client = new Client({ connectionString: poolerUrl });

    try {
        await client.connect();
        console.log(`✅ Connected!`);

        console.log('Executing 20260420_shop_items.sql migration...');
        const shopMigration = fs.readFileSync('database/migrations/20260420_shop_items.sql', 'utf8');
        await client.query(shopMigration);
        console.log('✅ Shop Items table and schema migration successful.');

        console.log('Executing add_purchase_type.sql...');
        const purchaseTypeMigration = fs.readFileSync('database/add_purchase_type.sql', 'utf8');
        await client.query(purchaseTypeMigration);
        console.log('✅ Added purchase enum type to transactions.');
        
    } catch (err) {
        console.error('❌ Migration Error:', err);
    } finally {
        await client.end();
    }
}

runLiveMigration();
