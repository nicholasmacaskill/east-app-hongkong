import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0); // 10:00 AM tomorrow
  const startTime = tomorrow.toISOString();
  
  const end = new Date(tomorrow);
  end.setHours(11, 0, 0, 0); // 11:00 AM tomorrow
  const endTime = end.toISOString();

  // 1. Create a dummy session type if needed (or just use generic)
  const { data: service } = await supabaseAdmin
      .from('session_types')
      .insert({
          title: 'Drag and Drop Test Class',
          category: 'CLASS',
          description: 'Testing the new UI',
          image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80'
      })
      .select()
      .single();

  const serviceId = service?.id || 1; // Fallback to 1 if it fails

  // 2. Create the session with max_capacity = 1
  const { data: session, error } = await supabaseAdmin
      .from('sessions')
      .insert({
          title: 'Drag and Drop Test Class',
          description: 'Try dragging both you and your child into this class to test the capacity block!',
          start_time: startTime,
          end_time: endTime,
          category: 'CLASS',
          session_type_id: serviceId,
          max_capacity: 1, // STRICT LIMIT OF 1
          status: 'active'
      })
      .select()
      .single();

  if (error) {
      console.error("Failed to create session:", error);
  } else {
      console.log(`✅ Successfully created session "${session.title}" for tomorrow at 10:00 AM!`);
      console.log(`Strict Capacity Limit set to: ${session.max_capacity}`);
  }
}

main();
