import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRegs() {
    const { count: regCount, error } = await supabase.from('registrations').select('*', { count: 'exact', head: true });
    console.log("Total registrations currently in db:", regCount, error || '');

    // Let's also check if user's credits logic has an anomaly
    // Or if Stripe is actually Live!
    const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    console.log("Stripe Key used in Production starts with:", publishable ? publishable.substring(0, 10) : 'none');
}

checkRegs();
