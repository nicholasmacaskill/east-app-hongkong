import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing prod keys');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findCoaches() {
    console.log('Querying production profiles for coaches...');
    const { data: coaches, error } = await supabase
        .from('profiles')
        .select('id, contact_email, first_name, last_name, role')
        .in('role', ['coach', 'sys-admin', 'admin']);
        
    if (error) {
        console.error('Error fetching coaches:', error);
    } else {
        console.log('--- Admins & Coaches ---');
        coaches.forEach(c => {
            console.log(`${c.first_name} ${c.last_name} | Role: ${c.role} | Email: ${c.contact_email}`);
        });
    }
}

findCoaches();
