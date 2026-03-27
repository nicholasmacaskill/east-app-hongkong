import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const s = createClient(supabaseUrl, serviceRoleKey);

async function setupAdmin() {
    const email = 'admin@east.com';
    const password = '123';
    
    console.log('Setting up primary admin:', email);
    
    // 1. Fetch all users to find existing ID
    let allUsers: any[] = [];
    let page = 1;
    while(true) {
        const { data, error }: any = await s.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        if (data.users.length === 0) break;
        allUsers = allUsers.concat(data.users);
        page++;
        if (page > 10) break;
    }

    let user = allUsers.find(u => u.email === (email.toLowerCase()));
    
    if (!user) {
        console.log('User not found in Auth, creating...');
        const { data, error } = await s.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { first_name: 'Nic', last_name: 'Admin', role: 'sys-admin' }
        });
        if (error) throw error;
        user = data.user;
    } else {
        console.log(`User exists (ID: ${user.id}), updating password and metadata...`);
        const { error } = await s.auth.admin.updateUserById(user.id, { 
            password,
            user_metadata: { role: 'sys-admin', first_name: 'Nic', last_name: 'Admin' }
        });
        if (error) throw error;
    }

    if (!user) throw new Error('Failed to identify target user');

    // 2. Ensure profile exists and has sys-admin role
    console.log(`Configuring profile for ID: ${user.id}`);
    const { error: profileError } = await s.from('profiles').upsert({
        id: user.id,
        first_name: 'Nic',
        last_name: 'Admin',
        role: 'sys-admin',
        contact_email: email,
        account_status: 'active'
    });
    
    if (profileError) throw profileError;
    
    console.log('Successfully configured primary admin.');
}

setupAdmin().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
});
