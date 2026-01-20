const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Updating Transactions Table: Adding manual type');

    const sql = `
    ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
    CHECK (type IN ('topup', 'membership', 'transfer', 'booking', 'refund', 'manual'));
    `;

    const { data, error } = await supabase.rpc('run_sql', { sql });

    if (error) {
        console.error('❌ Migration failed:', error);
    } else {
        console.log('✅ Transactions type constraint updated successfully.');
    }
}

runMigration();
