const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
  console.log('--- Cleaning up Ticket #12 Clutter ---');

  const patterns = [
    '%South Bay%',
    '%Green Pad%',
    '%Blue Pad%',
    '%North Bay%',
    '%South - Bay%',
    '%Green - Shooting Pad%',
    '%Blue - Shooting Pad%'
  ];

  for (const pattern of patterns) {
    console.log(`Checking for sessions matching: ${pattern}`);
    const { data: sessions, error: countError } = await supabase
      .from('sessions')
      .select('id, title')
      .ilike('title', pattern);

    if (countError) {
      console.error(`Error fetching sessions for ${pattern}:`, countError);
      continue;
    }

    if (sessions && sessions.length > 0) {
      console.log(`Found ${sessions.length} sessions to delete for pattern ${pattern}`);
      
      const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .ilike('title', pattern);

      if (deleteError) {
        console.error(`Error deleting sessions for ${pattern}:`, deleteError);
      } else {
        console.log(`✅ Successfully deleted ${sessions.length} sessions.`);
      }
    } else {
      console.log('No sessions found.');
    }
  }

  console.log('\n--- Checking for orphaned sessions ---');
  const { data: sessionTypes } = await supabase.from('session_types').select('id');
  const validIds = sessionTypes?.map(st => st.id) || [];

  if (validIds.length > 0) {
      console.log(`Checking for sessions with session_type_id NOT IN current valid list...`);
      const { data: orphans } = await supabase
        .from('sessions')
        .select('id, title')
        .not('session_type_id', 'in', `(${validIds.join(',')})`);
      
      if (orphans && orphans.length > 0) {
          console.log(`Found ${orphans.length} orphaned sessions. Deleting...`);
          const { error: delOrphanError } = await supabase
            .from('sessions')
            .delete()
            .not('session_type_id', 'in', `(${validIds.join(',')})`);
          
          if (delOrphanError) console.error('Error deleting orphans:', delOrphanError);
          else console.log('✅ Deleted orphaned sessions.');
      } else {
          console.log('No orphaned sessions found.');
      }
  }

  console.log('\n--- Ticket #12 Resolution Attempt Complete ---');
}

cleanup();
