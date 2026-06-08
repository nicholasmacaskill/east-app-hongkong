import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function countParents() {
  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'parent');
    
  if (error) {
    console.error("Error counting parents:", error);
  } else {
    console.log(`\n📊 TOTAL PARENT ACCOUNTS IN PRODUCTION: ${count}\n`);
  }
}

countParents();
