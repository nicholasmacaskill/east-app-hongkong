import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://app.eastsportsgroup.com').replace(/\\n$/, '');

const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_EMAIL = 'profile-demo@east.com';
const DEMO_PASSWORD = 'DemoView2026!';

const FITNESS_STATS = {
  test: 'Spring Combine 2026',
  on_ice_agility: '00:14',
  on_ice_agility_with_puck: '00:18',
  skating: '00:22',
  critical_power_max: 5,
  critical_power_fatigue: 10,
  agility: '00:11',
  pushups: 52,
  squat_1rm: 125,
  bench_press_1rm: 85,
  deadlift_1rm: 140,
  clean_1rm: 70,
  long_jump: 245,
  targets: 18,
  vald_grip: 62,
  vald_drop_jump: 41,
  vald_cmj: 39,
  vald_cmj_sl: 34,
  height: 178,
  weight: 72,
};

async function ensureDemoUser() {
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  const existing = listed.users.find((u) => u.email === DEMO_EMAIL);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'player', first_name: 'Demo', last_name: 'Player' },
    });
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'player', first_name: 'Demo', last_name: 'Player' },
  });
  if (error) throw error;
  return data.user!.id;
}

async function run() {
  const userId = await ensureDemoUser();

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'player',
    first_name: 'Demo',
    last_name: 'Player',
    username: 'demoplayer',
    team: 'EAST DEMO',
    bio: 'Sample profile for the new stats layout.',
    account_status: 'active',
    credits: 25,
  });
  if (profileError) throw profileError;

  const { error: statsError } = await supabase.from('players_stats').upsert(
    {
      player_id: userId,
      category: 'FITNESS_TEST',
      stats: FITNESS_STATS,
      verified: true,
      is_verified: true,
    },
    { onConflict: 'player_id,category' }
  );
  if (statsError) throw statsError;

  console.log('\n--- PROFILE DEMO READY ---');
  console.log(`Login URL: ${baseUrl}/login`);
  console.log(`Email: ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);
  console.log(`Profile URL: ${baseUrl}/profile/${userId}`);
  console.log(`Home profile tab: ${baseUrl}/?tab=profile`);
  console.log(`User ID: ${userId}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});