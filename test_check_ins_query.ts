import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testCheckInQuery() {
  console.log('Testing check_ins count query...');
  
  // Try to query count across the entire table using anon key (might be 0 due to RLS if not logged in, but will test the schema)
  // Let's use service_role for this test to actually get a count
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { count, error } = await supabaseAdmin
    .from('check_ins')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error fetching check-ins:', error);
    process.exit(1);
  }
  
  console.log(`Successfully connected and queried check_ins table! Total check-ins in DB: ${count}`);
}

testCheckInQuery();
