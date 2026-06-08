import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // 1. Find the test parent profile we just created
  const { data: profiles, error: pError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('last_name', 'Parent (Magic Link)')
    .limit(1);
    
  if (pError || !profiles || profiles.length === 0) {
    console.error("Could not find the test parent account.");
    return;
  }
  
  const parentId = profiles[0].id;

  // 2. Fix the parent profile (give credits, activate, normal name)
  await supabaseAdmin.from('profiles').update({
      first_name: 'QA',
      last_name: 'Tester',
      credits: 100,
      subscription_status: 'active'
  }).eq('id', parentId);

  // 3. Create a child user
  const childEmail = `child-magic-${Date.now()}@test.com`;
  const { data: childData } = await supabaseAdmin.auth.admin.createUser({
      email: childEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: { role: 'player' }
  });

  if (childData?.user) {
      // 4. Link child profile to parent
      await supabaseAdmin.from('profiles').upsert({
          id: childData.user.id,
          contact_email: childEmail,
          parent_id: parentId,
          first_name: 'Timmy',
          last_name: 'Tester',
          role: 'player'
      });
      console.log("✅ Fixed parent name, added 100 credits, unlocked account, and attached child athlete 'Timmy Tester'!");
  } else {
      console.log("Failed to create child auth user.");
  }
}

main();
