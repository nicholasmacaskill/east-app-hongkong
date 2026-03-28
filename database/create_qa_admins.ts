import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local before any other imports that might use env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';

async function createQAAdmins() {
  const supabase = getSupabaseAdmin();
  const password = 'EastAppQA2026!'; // Secure common password for QA team
  const domains = ['qaben', 'qafiona', 'qanic'];

  console.log('--- Starting QA Admin Creation ---');

  for (const name of domains) {
    const email = `${name}@east.com`;
    console.log(`Processing: ${email}...`);

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`  - ${email} already exists in Auth.`);
      } else {
        console.error(`  - Failed to create auth user ${email}:`, authError.message);
        continue;
      }
    }

    // 2. We need the UID to create the profile
    let userId = authData?.user?.id;
    if (!userId) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData.users.find(u => u.email === email);
        userId = existing?.id;
    }

    if (!userId) {
        console.error(`  - Could not find UID for ${email}`);
        continue;
    }

    // 3. Create/Update Profile with 'sys-admin' role (confirmed via DB query)
    const firstName = name.replace('qa', '').charAt(0).toUpperCase() + name.replace('qa', '').slice(1);
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        contact_email: email,
        first_name: firstName,
        last_name: 'QA',
        role: 'sys-admin' // Fixed: use sys-admin which is valid in profiles_role_check
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`  - Failed to upsert profile for ${email}:`, profileError.message);
    } else {
      console.log(`  - ✅ Successfully configured ${email} as Admin (UID: ${userId})`);
    }
  }

  console.log('--- QA Admin Creation Finished ---');
}

createQAAdmins();
