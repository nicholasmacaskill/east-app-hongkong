import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

async function findTestCoach() {
    // Get profiles
    const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('role', ['coach', 'admin', 'sys-admin'])
        .order('created_at', { ascending: true });
    
    if (error) { console.error(error.message); return; }
    console.table(data);

    // Get emails from auth.users via service role
    const ids = (data || []).map(p => p.id);
    const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
    if (!uErr && users) {
        const coaches = users.users.filter(u => ids.includes(u.id));
        console.log('\nEmails:');
        coaches.forEach(u => {
            const profile = data?.find(p => p.id === u.id);
            console.log(`  ${profile?.first_name} ${profile?.last_name} (${profile?.role}): ${u.email}`);
        });
    }
    
    if (error) console.error(error.message);
    else console.table(data);
}

findTestCoach();
