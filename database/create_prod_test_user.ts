/**
 * Creates a test user on the PRODUCTION Supabase project
 * Run: npx ts-node --project tsconfig.script.json database/create_prod_test_user.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PROD_URL = 'https://ktlicvvczrlppqkcqedv.supabase.co';
const PROD_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function createProdTestUser() {
  const admin = createClient(PROD_URL, PROD_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const email = 'test@eastsportsgroup.com';
  const password = 'EastTest2026!';

  console.log(`Creating test user: ${email} on PRODUCTION...`);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: 'Test', last_name: 'User', role: 'player' }
  });

  if (error && !error.message.includes('already been registered')) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  const userId = data?.user?.id || (
    await admin.from('profiles').select('id').eq('contact_email', email).single()
  ).data?.id;

  if (!userId) { console.error('❌ Could not resolve user ID'); process.exit(1); }

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  await admin.from('profiles').update({
    first_name: 'Test',
    last_name: 'User',
    role: 'player',
    credits: 500,
    account_status: 'active',
    subscription_status: 'active',
  }).eq('id', userId);

  console.log('\n✅ PRODUCTION TEST ACCOUNT READY');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   URL:      https://app.eastsportgroup.com`);
  process.exit(0);
}

createProdTestUser();
