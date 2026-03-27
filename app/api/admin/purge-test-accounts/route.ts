import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is sys-admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'sys-admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Sys-Admin only' }, { status: 403 });
    }

    console.log('Starting mass purge initiated by:', user.email);

    let allDeleted = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000
      });

      if (listError) throw listError;
      if (users.length === 0) {
        hasMore = false;
        break;
      }

      const toDelete = users.filter(u => {
        const email = u.email?.toLowerCase() || '';
        
        // PROTECT corporate accounts (ends with @east.com)
        if (email.endsWith('@east.com')) return false;

        // Criteria: includes 'test', 'audit', 'qa', or 'verify'
        const keywords = ['test', 'audit', 'qa', 'verify'];
        return keywords.some(k => email.includes(k));
      });

      for (const u of toDelete) {
        try {
          // 1. Delete from dependent tables to resolve FK constraints
          // Many have ON DELETE CASCADE, but some (like profiles) might block auth deletion
          await supabaseAdmin.from('engineering_tickets').delete().eq('reporter_id', u.id);
          await supabaseAdmin.from('registrations').delete().or(`user_id.eq.${u.id},payer_id.eq.${u.id}`);
          await supabaseAdmin.from('player_relationships').delete().or(`parent_id.eq.${u.id},child_id.eq.${u.id}`);
          await supabaseAdmin.from('players_stats').delete().eq('player_id', u.id);
          await supabaseAdmin.from('availability').delete().eq('coach_id', u.id);
          await supabaseAdmin.from('messages').delete().or(`sender_id.eq.${u.id},receiver_id.eq.${u.id}`);
          await supabaseAdmin.from('likes').delete().eq('user_id', u.id);
          await supabaseAdmin.from('posts').delete().eq('user_id', u.id);
          await supabaseAdmin.from('transactions').delete().eq('user_id', u.id);
          
          // 2. Delete the profile (which blocks auth.users deletion)
          await supabaseAdmin.from('profiles').delete().eq('id', u.id);

          // 3. Finally, delete the Auth User
          const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(u.id);
          
          if (!delError) {
            allDeleted.push(u.email);
          } else {
            console.error(`Failed to delete Auth User ${u.email}:`, delError.message);
          }
        } catch (err: any) {
          console.error(`Critical failure during purge for ${u.email}:`, err.message);
        }
      }

      if (users.length < 1000) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return NextResponse.json({
      success: true,
      count: allDeleted.length,
      deletedEmails: allDeleted
    });

  } catch (error: any) {
    console.error('Purge error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
