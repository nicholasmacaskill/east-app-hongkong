import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Force connecting to the Live Environment for backups
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ CRITICAL ERROR: Missing Live Production Keys in .env.production");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupDatabase() {
    console.log("=== INITIATING LIVE DATABASE BACKUP ===");
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(__dirname, '../backups');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const backupFile = path.join(backupDir, `db_backup_${timestamp}.json`);
    const backupData: Record<string, any> = {};

    const tables = ['profiles', 'sessions', 'registrations', 'transactions'];

    for (const table of tables) {
        console.log(`[DOWNLOADING] Archiving table: ${table}...`);
        
        let allRows: any[] = [];
        let hasMore = true;
        let start = 0;
        const step = 1000;

        while (hasMore) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .range(start, start + step - 1);

            if (error) {
                console.error(`❌ Error fetching ${table}:`, error.message);
                hasMore = false;
                break;
            }

            if (data && data.length > 0) {
                allRows = allRows.concat(data);
                start += step;
            } else {
                hasMore = false;
            }
        }

        backupData[table] = allRows;
        console.log(`✅ [SUCCESS] Archived ${allRows.length} rows for ${table}.`);
    }

    console.log(`\n[SAVING] Writing backup file to disk...`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`✅ [COMPLETE] Database securely backed up to: ${backupFile}`);
}

backupDatabase().catch(console.error);
