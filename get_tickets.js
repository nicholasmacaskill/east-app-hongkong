const { createClient } = require('@supabase/supabase-js');

// Constants from .env.staging
const supabaseUrl = 'https://lzqnviblkcnjsxutqeht.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cW52aWJsa2NuanN4dXRxZWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgyMjEyMSwiZXhwIjoyMDkwMzk4MTIxfQ.zkfbtc7Bv_Dsswe9Nwtzf9Yq4ZO4JdLzDRSuGxGq9uk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('engineering_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tickets:', error);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

main();
