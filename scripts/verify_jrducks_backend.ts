import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hzltndrltyseifwbmjeg.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.argv[2] || '';

const client = createClient(SUPABASE_URL, ANON_KEY);

async function verifyJrDucksProduction() {
  console.log('🧪 Verifying Anaheim Jr. Ducks Live Backend...');

  // 1. Test Admin Login
  console.log('\n1. Testing Admin Auth (admin@jrducks.com)...');
  const { data: adminAuth, error: adminErr } = await client.auth.signInWithPassword({
    email: 'admin@jrducks.com',
    password: 'JrDucks2026!Admin'
  });
  if (adminErr) throw new Error(`Admin auth failed: ${adminErr.message}`);
  console.log(`✅ Admin authenticated! User ID: ${adminAuth.user.id}`);

  // Fetch admin profile
  const { data: adminProf } = await client.from('profiles').select('*').eq('id', adminAuth.user.id).single();
  console.log(`   Role: ${adminProf.role}, Name: ${adminProf.first_name} ${adminProf.last_name}`);
  if (adminProf.role !== 'sys-admin') throw new Error(`Expected sys-admin, got ${adminProf.role}`);

  // 2. Test Coach Login
  console.log('\n2. Testing Coach Auth (scott.niedermayer@jrducks.com)...');
  const { data: coachAuth, error: coachErr } = await client.auth.signInWithPassword({
    email: 'scott.niedermayer@jrducks.com',
    password: 'JrDucks2026!Coach'
  });
  if (coachErr) throw new Error(`Coach auth failed: ${coachErr.message}`);
  console.log(`✅ Coach authenticated! User ID: ${coachAuth.user.id}`);
  const { data: coachProf } = await client.from('profiles').select('*').eq('id', coachAuth.user.id).single();
  console.log(`   Role: ${coachProf.role}, Name: ${coachProf.first_name} ${coachProf.last_name}`);

  // 3. Test Player Login
  console.log('\n3. Testing Player Auth (trevor.zegras.jr@jrducks.com)...');
  const { data: playerAuth, error: playerErr } = await client.auth.signInWithPassword({
    email: 'trevor.zegras.jr@jrducks.com',
    password: 'JrDucks2026!Player'
  });
  if (playerErr) throw new Error(`Player auth failed: ${playerErr.message}`);
  console.log(`✅ Player authenticated! User ID: ${playerAuth.user.id}`);
  const { data: playerProf } = await client.from('profiles').select('*').eq('id', playerAuth.user.id).single();
  console.log(`   Role: ${playerProf.role}, Team: ${playerProf.team}, Credits: ${playerProf.credits}`);

  // 4. Test Sessions & Schedule Query
  console.log('\n4. Testing Sessions & Schedule Fetch...');
  const { data: sessions, error: sessErr } = await client.from('sessions').select('*').order('start_time', { ascending: true });
  if (sessErr) throw new Error(`Sessions fetch failed: ${sessErr.message}`);
  console.log(`✅ Found ${sessions.length} upcoming scheduled Jr Ducks sessions:`);
  sessions.forEach(s => console.log(`   • ${s.title} (${s.instructor}) - ${s.credit_cost} credits`));

  // 5. Test Announcements Query
  console.log('\n5. Testing Announcements Fetch...');
  const { data: announcements, error: annErr } = await client.from('announcements').select('*');
  if (annErr) throw new Error(`Announcements fetch failed: ${annErr.message}`);
  console.log(`✅ Found ${announcements.length} announcements:`);
  announcements.forEach(a => console.log(`   • ${a.title}`));

  console.log('\n🎯 All Anaheim Jr. Ducks Production Backend Checks PASSED 100%!');
}

verifyJrDucksProduction().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
