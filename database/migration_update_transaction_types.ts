import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Updating Transactions Table: Adding manual type');

    // We need to alter the check constraint. 
    // Usually easier to drop and recreate if we don't know the generated name, 
    // or just use a script that finds it.
    // In this case, since it's a new table, we might just re-run the create or use an alter.

    const sql = `
    -- Try to add the manual type by replacing the constraint
    -- First, we need to find the constraint name. It's usually transactions_type_check
    ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
    
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
    CHECK (type IN ('topup', 'membership', 'transfer', 'booking', 'refund', 'manual'));
    `;

    // Note: If using Postgres 12+, we could use enum, but East App uses text checks for simplicity.

    const { error } = await supabase.rpc('run_sql', { sql });

    if (error) {
        console.error('❌ Migration failed:', error);
    } else {
        console.log('✅ Transactions type constraint updated successfully.');
    }
}

runMigration();
