import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAdmins() {
    console.log("=== SCANNING PRODUCTION FOR SYS-ADMIN USERS ===");
    const { data: admins, error } = await supabase
        .from('profiles')
        .select('id, contact_email, first_name, last_name, role')
        .eq('role', 'sys-admin');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${admins.length} sys-admin users:`);
    admins.forEach(a => {
        console.log(`- ${a.contact_email} (Name: ${a.first_name} ${a.last_name})`);
    });
}
listAdmins();
