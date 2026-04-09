const { createClient } = require('@supabase/supabase-js');

const url = "https://ktlicvvczrlppqkcqedv.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0bGljdnZjenJscHBxa2NxZWR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI4NjUzOSwiZXhwIjoyMDg0ODYyNTM5fQ.FwP2etidl41nG9THvtuu7-jg7MtBNtCNxzupwq_HNu8";

const supabase = createClient(url, key);

async function run() {
  const email = 'sebastien.brien@gmail.com';
  console.log(`Checking ${email} in Production...`);
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error.message);
    return;
  }

  const user = users.find(u => u.email === email);
  if (user) {
    console.log('✅ User found in Auth!');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Last Sign In:', user.last_sign_in_at);
    
    // Check profile
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (pError) {
      console.error('Error fetching profile:', pError.message);
    } else {
      console.log('✅ Profile found!');
      console.log('Role:', profile.role);
    }
  } else {
    console.log('❌ User NOT FOUND in Auth.');
    console.log('Total users listed:', users.length);
  }
}

run();
