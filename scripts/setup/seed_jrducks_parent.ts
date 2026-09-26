import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';

const JRDUCKS_DB_URL = 'postgresql://postgres:Plot3-Dismount8-Coach2-Anthem0-Emission3@db.hzltndrltyseifwbmjeg.supabase.co:5432/postgres';
const SUPABASE_URL = 'https://hzltndrltyseifwbmjeg.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6bHRuZHJsdHlzZWlmd2JtamVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MzI5NjcsImV4cCI6MjEwNTEwODk2N30.sPLp_cYI5Kq7_gayvP_SZu4TgXY0PBCxOZwtgGfSW1Y';

const PARENT_ID = '4b82d499-56bf-4e9e-8742-8c90962383c2';
const PARENT_EMAIL = 'parent@jrducks.com';
const PARENT_PASS = 'JrDucks2026!Parent';

async function main() {
  const client = new Client({
    connectionString: JRDUCKS_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Jr Ducks DB.');

  // 1. Clean previous attempts
  await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [PARENT_ID]);
  await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [PARENT_ID]);

  // 2. Auth Users
  await client.query(`
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token,
      is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      $1::uuid,
      'authenticated', 'authenticated',
      $2,
      crypt($3, gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Mark","last_name":"Zegras","role":"parent","email_verified":true}'::jsonb,
      now(), now(),
      '', '', '', '',
      false, false
    );
  `, [PARENT_ID, PARENT_EMAIL, PARENT_PASS]);

  console.log('Auth user created.');

  // 3. Auth Identity
  const identityData = JSON.stringify({
    sub: PARENT_ID,
    email: PARENT_EMAIL,
    email_verified: false,
    phone_verified: false
  });

  await client.query(`
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1::uuid, $2::jsonb, 'email', $1,
      now(), now(), now()
    );
  `, [PARENT_ID, identityData]);

  console.log('Auth identity created.');

  // 3. Profiles
  await client.query(`
    INSERT INTO public.profiles (
      id, first_name, last_name, username, role, bio, credits, subscription_status, account_status, contact_email
    ) VALUES (
      $1::uuid, 'Mark', 'Zegras', 'mark.zegras', 'parent', 'Hockey Parent & Family Account', 150, 'active', 'active', $2
    )
    ON CONFLICT (id) DO UPDATE SET
      first_name = 'Mark',
      last_name = 'Zegras',
      role = 'parent',
      subscription_status = 'active',
      account_status = 'active',
      credits = 150,
      contact_email = $2;
  `, [PARENT_ID, PARENT_EMAIL]);

  console.log('Profile created/updated.');

  // 4. Link Trevor Zegras Jr.
  await client.query(`
    UPDATE public.profiles
    SET parent_id = $1::uuid
    WHERE id = '10ab8018-9a83-4bec-9339-227f9840dc93'::uuid;
  `, [PARENT_ID]);

  console.log('Trevor Zegras Jr. linked to Mark Zegras.');
  await client.end();

  // Test sign in
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: PARENT_EMAIL,
    password: PARENT_PASS
  });

  if (error) {
    throw new Error('Supabase Auth verification failed: ' + error.message);
  }

  console.log('🎉 Parent Auth Verified! User ID:', data.user.id);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
