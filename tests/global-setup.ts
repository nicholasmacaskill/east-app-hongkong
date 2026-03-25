import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function globalSetup() {
  console.log('🧹 GLOBAL SETUP: Purging old test/QA accounts...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error('❌ Failed to list users for cleanup:', listError.message);
    return;
  }

  const keywords = ['test', 'qa', 'reminder'];
  const protectedEmails = ['admin@east.com', 'rick@dynevents.com', 'nicholasmacaskill@proton.me'];

  const toDelete = users.filter(u => {
    const email = (u.email || '').toLowerCase();
    const isProtected = protectedEmails.includes(email);
    const matchesMatch = keywords.some(k => email.includes(k));
    return matchesMatch && !isProtected;
  });

  if (toDelete.length === 0) {
    console.log('✅ No test accounts to purge.');
    return;
  }

  console.log(`🗑️ Deleting ${toDelete.length} orphaned test accounts...`);
  const ids = toDelete.map(u => u.id);

  // Clear dependencies first
  try {
    await Promise.all([
      supabase.from('admin_audit_logs').delete().in('admin_id', ids),
      supabase.from('announcements').delete().in('created_by', ids),
      supabase.from('likes').delete().in('user_id', ids),
      supabase.from('posts').delete().in('user_id', ids),
      supabase.from('players_stats').update({ verified_by: null }).in('verified_by', ids),
      supabase.from('transactions').delete().in('user_id', ids),
    ]);
    
    await supabase.from('profiles').delete().in('id', ids);

    for (const id of ids) {
      await supabase.auth.admin.deleteUser(id);
    }
    console.log(`✅ Successfully purged ${toDelete.length} accounts.`);
  } catch (err) {
    console.error('⚠️ Partial cleanup failure:', err);
  }
}

export default globalSetup;
