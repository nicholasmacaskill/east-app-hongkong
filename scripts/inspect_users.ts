import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function inspectUsers() {
    const supabase = getSupabaseAdmin();

    console.log('--- Auth Users ---');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Auth Error:', authError);
        return;
    }

    users.forEach(u => {
        console.log(`ID: ${u.id}, Email: ${u.email}`);
    });

    console.log('\n--- Profiles ---');
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, contact_email, first_name, last_name, role');
    if (profileError) {
        console.error('Profile Error:', profileError);
        return;
    }

    profiles.forEach(p => {
        console.log(`ID: ${p.id}, Email: ${p.contact_email}, Name: ${p.first_name} ${p.last_name}, Role: ${p.role}`);
    });
}

inspectUsers().catch(console.error);
