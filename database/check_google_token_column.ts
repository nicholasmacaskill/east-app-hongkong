import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';

async function check() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('profiles')
    .select('google_refresh_token')
    .limit(1);

  if (error?.message?.includes('column') || error?.message?.includes('does not exist')) {
    console.log('❌ Column does NOT exist — run the SQL migration.');
  } else {
    console.log('✅ Column exists — you are good to go.');
  }
  process.exit(0);
}
check();
