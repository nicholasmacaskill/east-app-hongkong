import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv(file: string) {
  const envPath = path.resolve(process.cwd(), file);
  const result: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return result;
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
      if (key && !key.startsWith('#')) result[key] = value;
    }
  });
  return result;
}

const env = loadEnv('.env.staging');
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function test() {
  const testEmail = `trigger-test-${Date.now()}@east.com`;
  console.log(`Creating test user: ${testEmail}`);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'TestPass123!',
    email_confirm: true,
    user_metadata: { first_name: 'Trigger', last_name: 'Test', role: 'player' }
  });

  if (authError || !authData.user) {
    console.error('❌ Failed to create auth user:', authError?.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`✅ Auth user created: ${userId}`);

  // Wait briefly for trigger to fire
  await new Promise(r => setTimeout(r, 500));

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, contact_email')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('❌ Profile NOT created by trigger:', profileError?.message);
  } else {
    console.log('✅ Profile auto-created by trigger:', profile);
  }

  // Cleanup
  await supabase.auth.admin.deleteUser(userId);
  console.log('🧹 Test user cleaned up');
}

test();
