/**
 * Migration: Add google_refresh_token to profiles
 * Run: npx ts-node --project tsconfig.script.json database/add_google_calendar_token.ts
 */
import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';

async function migrate() {
  const admin = getSupabaseAdmin();

  console.log('🔄 Adding google_refresh_token column to profiles...');

  // Add the column
  const { error: colError } = await admin.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS google_refresh_token TEXT DEFAULT NULL;
    `,
  });

  if (colError) {
    // Fallback: direct via raw query approach
    console.warn('RPC not available, trying direct insert check...');
    const { error: checkError } = await admin
      .from('profiles')
      .select('google_refresh_token')
      .limit(1);

    if (checkError?.message?.includes('column') && checkError.message.includes('does not exist')) {
      console.error('❌ Column does not exist and could not be added via RPC.');
      console.log('👉 Run this SQL manually in Supabase dashboard:');
      console.log(`
        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS google_refresh_token TEXT DEFAULT NULL;

        COMMENT ON COLUMN public.profiles.google_refresh_token IS 
        'Google OAuth refresh token for Calendar sync. Server-side only — never exposed to client.';
      `);
      process.exit(1);
    } else {
      console.log('✅ Column already exists.');
    }
  } else {
    console.log('✅ google_refresh_token column added successfully.');
  }

  console.log('\n📋 ACTION REQUIRED — Run this SQL in Supabase Dashboard SQL Editor:');
  console.log(`
-- Protect google_refresh_token: clients cannot SELECT it
-- (supabaseAdmin bypasses RLS so server routes still work)
REVOKE SELECT (google_refresh_token) ON public.profiles FROM authenticated;
REVOKE SELECT (google_refresh_token) ON public.profiles FROM anon;

COMMENT ON COLUMN public.profiles.google_refresh_token IS 
'Google OAuth refresh token for Calendar sync. Server-side only.';
  `);

  console.log('\n✅ Migration complete.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
