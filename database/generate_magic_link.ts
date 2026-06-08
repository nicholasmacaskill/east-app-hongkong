import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Use .env.test because we want to generate a link for the test database
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // 1. Create a fresh test parent account
  const testEmail = `magic-link-${Date.now()}@test.com`;
  
  const { data: userData, error: pError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: { role: 'parent' }
  });
    
  if (pError || !userData?.user) {
    console.error("Could not create a test parent account:", pError);
    return;
  }
  
  // Create their profile
  await supabaseAdmin.from('profiles').upsert({
      id: userData.user.id,
      contact_email: testEmail,
      first_name: 'Test',
      last_name: 'Parent (Magic Link)',
      role: 'parent'
  });
  
  const email = testEmail;
  
  // 2. Generate a magic link redirecting to the test branch
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: {
      redirectTo: 'https://test-branch-east.vercel.app/facilities'
    }
  });

  if (error) {
    console.error("Failed to generate magic link:", error);
  } else {
    console.log(`\n✅ INSTANT LOGIN LINK FOR [${email}]:\n`);
    console.log(data.properties?.action_link);
    console.log(`\n(This link will securely authenticate you and redirect you to the /facilities booking page on the test branch)`);
  }
}

main();
