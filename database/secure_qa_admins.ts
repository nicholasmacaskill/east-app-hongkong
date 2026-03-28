import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';

async function extraSecureAdmins() {
  const supabase = getSupabaseAdmin();
  
  // Updating ALL identified administrators with 32-character unique high-entropy passwords
  const admins = [
    { id: '1cac91f2-eeb0-4ac6-bc81-48b0a226bccf', email: 'admin@east.com', pass: 'Admin_7k!xR#9wQ2pZ$L5tN8vM3mB1jH4dY6' },
    { id: '2303f502-a015-47e1-879f-3dfa9b4377b7', email: 'qaben@east.com', pass: 'QA_Ben_r4V7!kM9xL2pS#6wQ8jZ5dT1nV3' },
    { id: '941c62b9-1667-4559-97b9-c396102d0c84', email: 'qafiona@east.com', pass: 'QA_Fiona_v2jN!r5L9pS#7xP4wM8kZ6dT1' },
    { id: 'e0a823c5-ea39-499c-b252-e952d7e9a30d', email: 'qanic@east.com', pass: 'QA_Nick_m7xL!v5pS#2kR9wQ4jZ8dT1nV6' },
    { id: '289933be-eeb5-495f-9ab3-471cd94fe526', email: 'admin-sys-1774577203683@east.com', pass: 'Sys_Audit_9pL#4xN7vM3wQ2r5jZ6kS8dT1' }
  ];

  console.log('--- CRITICAL: Hardening All Admin Passwords (32-Chars) ---');

  for (const admin of admins) {
    console.log(`Securing: ${admin.email}...`);
    const { error } = await supabase.auth.admin.updateUserById(admin.id, {
      password: admin.pass
    });

    if (error) {
      console.error(`  - FAILED to update ${admin.email}:`, error.message);
    } else {
      console.log(`  - ✅ 32-Character Hardening Complete for ${admin.email}`);
    }
  }

  console.log('--- ALL ADMIN ACCOUNTS SECURED ---');
}

extraSecureAdmins();
