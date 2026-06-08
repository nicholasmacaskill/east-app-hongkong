import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.production.latest' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing env'); process.exit(1); }
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function run() {
    const email = 'coach.demo@eastsportsgroup.com';
    const password = 'EastTest2026!';
    
    // Create user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            first_name: 'Demo',
            last_name: 'Coach',
            role: 'coach'
        }
    });

    if (authError && !authError.message.includes('already been registered')) {
        console.error('Error creating auth user:', authError);
        return;
    }

    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const user = userList.users.find(u => u.email === email);
    
    if (user) {
        // Force profile sync
        await supabaseAdmin.from('profiles').update({
            role: 'coach',
            first_name: 'Demo',
            last_name: 'Coach'
        }).eq('id', user.id);
        
        console.log(`Email: ${email}\nPassword: ${password}`);
    }
}
run();
