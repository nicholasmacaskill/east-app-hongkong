
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
                if (key && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.error("Failed to load .env.local", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('Running migration to add preferences column...');

    const { error } = await supabase.rpc('run_sql', {
        sql: "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;"
    });

    // Fallback if rpc is not available (common in some setups), try raw query if client supports it or just use the logic we have. 
    // Since we don't have direct SQL access via client usually without rpc, we rely on the user or this rpc.

    if (error) {
        console.error('RPC Error:', error);
        // Alternative: Try to just use the admin API? No, Supabase JS client doesn't do arbitrary SQL without a function.
        // Let's assume the user has a `exec_sql` or similar function, or we can't do it easily from here without psql.
        // However, we can try to just use the known workaround if this fails.
    } else {
        console.log('Migration command sent.');
    }
}

// Since we cannot easily run DDL from the JS client without a helper function in the DB, 
// and we don't know if 'run_sql' exists, let's try a different approach:
// We will use the `pg` library if available in node_modules (it is in package.json!).

import { Client } from 'pg';

async function runMigrationPg() {
    console.log("Attempting migration via pg...");
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL; // We need the direct connection string

    // We don't have the connection string in .env.local usually for Supabase unless added.
    // Let's check env vars again.

    if (!connectionString) {
        console.log("No POSTGRES_URL found. Cannot run DDL directly.");
        return;
    }

    const client = new Client({ connectionString });
    await client.connect();
    try {
        await client.query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;");
        console.log("Migration successful via PG client.");
    } catch (e) {
        console.error("PG Migration failed:", e);
    } finally {
        await client.end();
    }
}

// Actually, we probably don't have the connection string exposed to the Next.js app usually.
// Let's try to notify the user if we can't do it. 
// BUT, we can try to 'cheat' if we have the service role key, sometimes we can just use the Rest API to update a row and maybe it triggers something? No.

// Let's create a SQL file that the user can run, or try to run it if we can.
// Wait, I see `database/seed.ts` uses `ts-node`. I can try to use the same setup.

runMigration();
