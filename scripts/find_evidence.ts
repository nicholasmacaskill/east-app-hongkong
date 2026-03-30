import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactions() {
    // Check if transactions table exists
    const { data: tData, error: tError } = await supabase.from('transactions').select('*').limit(10);
    
    if (tError) {
        console.error("No transactions table or err:", tError.message);
    } else {
        console.log("TRANSACTIONS:", tData);
    }
    
    // Also let's check profile credit history or anything else.
    // Wait, let's check `admin_audit_logs`
    const { data: aData, error: aError } = await supabase.from('admin_audit_logs').select('*').limit(5);
    console.log("AUDIT LOGS:", aData);
}

checkTransactions();
