import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  const loggedInToday = users.filter(u => {
    if (!u.last_sign_in_at) return false;
    const signInDate = new Date(u.last_sign_in_at);
    return signInDate >= today;
  });

  console.log(`Found ${loggedInToday.length} users who logged in today.`);

  if (loggedInToday.length > 0) {
    const userIds = loggedInToday.map(u => u.id);
    
    // Check profiles or user roles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .in('id', userIds);

    if (profileError) {
      console.error('Profile query error:', profileError);
      
      // Try to get role from user metadata if profiles query fails or role column doesn't exist
      loggedInToday.forEach(u => {
         const role = u.user_metadata?.role || 'unknown';
         console.log(`User ${u.id} - Role (from metadata): ${role} - Last Sign In: ${u.last_sign_in_at}`);
      });
      return;
    }

    const profilesMap = new Map(profiles?.map(p => [p.id, p.role]) || []);

    loggedInToday.forEach(u => {
      const dbRole = profilesMap.get(u.id);
      const metaRole = u.user_metadata?.role;
      console.log(`User ${u.id} - Role (DB): ${dbRole} | Role (Meta): ${metaRole} - Last Sign In: ${u.last_sign_in_at}`);
    });
  }
}

main();
