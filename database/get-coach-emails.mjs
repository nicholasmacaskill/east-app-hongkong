import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.production.latest' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) { console.error(error); return; }
    
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, role');
    
    const coaches = profiles.filter(p => p.role === 'coach' || p.role === 'sys-admin');
    
    const coachUsers = coaches.map(c => {
        const authUser = users.users.find(u => u.id === c.id);
        return {
            name: `${c.first_name} ${c.last_name}`,
            role: c.role,
            email: authUser ? authUser.email : 'No email'
        }
    });
    console.log(JSON.stringify(coachUsers, null, 2));
}
run();
