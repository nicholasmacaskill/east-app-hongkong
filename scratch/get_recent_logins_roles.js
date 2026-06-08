const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  let allUsers = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 1000
    });
    
    if (error) {
      console.error(error);
      process.exit(1);
    }
    
    if (data.users && data.users.length > 0) {
      allUsers = allUsers.concat(data.users);
      page++;
    } else {
      hasMore = false;
    }
  }
  
  const recentLogins = allUsers.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) >= oneWeekAgo);
  const recentLoginIds = recentLogins.map(u => u.id);
  
  console.log(`Unique users logged in the last 7 days: ${recentLogins.length}`);
  
  if (recentLoginIds.length === 0) return;

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, role')
    .in('id', recentLoginIds);
    
  if (error) {
    console.error(error);
    process.exit(1);
  }
  
  const roleCounts = {};
  let notFound = recentLoginIds.length - profiles.length;
  
  profiles.forEach(p => {
    const r = p.role || 'unknown';
    roleCounts[r] = (roleCounts[r] || 0) + 1;
  });
  
  if (notFound > 0) {
    roleCounts['no_profile_record'] = notFound;
  }
  
  console.table(roleCounts);
}

run();
