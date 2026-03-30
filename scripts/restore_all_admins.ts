import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

async function restoreAdmins(envFile: string) {
  console.log(`\n--- Restoring Admin Passwords (${envFile}) ---`);
  dotenv.config({ path: path.resolve(process.cwd(), envFile) });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(`❌ Missing credentials in ${envFile}`);
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let allUsers: any[] = [];
  let page = 1;
  while(true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
        console.error(`❌ Error listing users: ${error.message}`);
        return;
    }
    if (users.length === 0) break;
    allUsers = allUsers.concat(users);
    page++;
    if (page > 10) break;
  }
  const users = allUsers;

  const adminConfigs = [
    { email: 'info@easthighperformancecentre.com', pass: 'EastPerformanceHQAdmin2026!!!!' },
    { email: 'admin@east.com', pass: 'Admin_7k!xR#9wQ2pZ$L5tN8vM3mB1jH4dY6' },
    { email: 'qaben@east.com', pass: 'QA_Ben_r4V7!kM9xL2pS#6wQ8jZ5dT1nV3' },
    { email: 'qafiona@east.com', pass: 'QA_Fiona_v2jN!r5L9pS#7xP4wM8kZ6dT1' },
    { email: 'qanic@east.com', pass: 'QA_Nick_m7xL!v5pS#2kR9wQ4jZ8dT1nV6' },
    { email: 'admin-sys-1774577203683@east.com', pass: 'Sys_Audit_9pL#4xN7vM3wQ2r5jZ6kS8dT1' }
  ];

  for (const config of adminConfigs) {
    console.log(`Restoring: ${config.email}...`);
    const user = users.find(u => u.email === config.email);

    if (!user) {
        console.error(`  - FAILED: User not found in Auth system.`);
        continue;
    }
    
    // Auth Update
    const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
      password: config.pass,
      user_metadata: { role: 'sys-admin' }
    });

    if (authError) {
        console.error(`  - Auth FAILED: ${authError.message}`);
    } else {
        console.log(`  - ✅ Auth Restored.`);
    }

    // Profile Enforcement
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'sys-admin' })
      .eq('id', user.id);

    if (profileError) {
        console.error(`  - Profile Sync FAILED: ${profileError.message}`);
    } else {
        console.log(`  - ✅ Profile Role Forced to sys-admin.`);
    }
  }
}

async function run() {
    const isProd = process.argv.includes('--prod');
    const envFile = isProd ? '.env.production' : '.env.local';
    await restoreAdmins(envFile);
    console.log('\n--- RESTORATION COMPLETE ---');
}

run();
