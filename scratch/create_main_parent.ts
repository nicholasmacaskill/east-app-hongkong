import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Force it to use the production database keys
dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const testEmail = `main-test-${Date.now()}@test.com`;
  
  const { data: userData, error: pError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: { role: 'parent' }
  });
    
  if (pError || !userData?.user) {
    console.error("Could not create parent account:", pError);
    return;
  }
  
  const parentId = userData.user.id;

  // Create their profile with credits and active sub
  await supabaseAdmin.from('profiles').upsert({
      id: parentId,
      contact_email: testEmail,
      first_name: 'Main',
      last_name: 'Tester',
      role: 'parent',
      credits: 100,
      subscription_status: 'active'
  });
  
  // Create a child user
  const childEmail = `main-child-${Date.now()}@test.com`;
  const { data: childData } = await supabaseAdmin.auth.admin.createUser({
      email: childEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: { role: 'player' }
  });

  if (childData?.user) {
      await supabaseAdmin.from('profiles').upsert({
          id: childData.user.id,
          contact_email: childEmail,
          parent_id: parentId,
          first_name: 'Little',
          last_name: 'Tester',
          role: 'player'
      });
      console.log(`\n✅ Production Test Account Created!`);
      console.log(`Login at: https://app.eastsportsgroup.com`);
      console.log(`Email: ${testEmail}`);
      console.log(`Password: password123\n`);
  }
}

main();
