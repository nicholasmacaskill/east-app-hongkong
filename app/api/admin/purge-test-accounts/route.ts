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

    let allDeleted = new Set<string>();

    // 1. Scan AUTH users
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

      const toDeleteFromAuth = users.filter(u => {
        const email = u.email?.toLowerCase() || '';
        if (email.endsWith('@east.com')) return false;
        const keywords = ['test', 'audit', 'qa', 'verify'];
        return keywords.some(k => email.includes(k));
      });

      for (const u of toDeleteFromAuth) {
        try {
          // Explicit cleanup of all possible FK tables
          await supabaseAdmin.from('engineering_tickets').delete().eq('reporter_id', u.id);
          await supabaseAdmin.from('registrations').delete().or(`user_id.eq.${u.id},payer_id.eq.${u.id}`);
          await supabaseAdmin.from('player_relationships').delete().or(`parent_id.eq.${u.id},child_id.eq.${u.id}`);
          await supabaseAdmin.from('players_stats').delete().eq('player_id', u.id);
          await supabaseAdmin.from('profiles').delete().eq('id', u.id);
          await supabaseAdmin.auth.admin.deleteUser(u.id);
          allDeleted.add(u.email || u.id);
        } catch (err: any) {
          console.error(`Purge failed for auth user ${u.email}:`, err.message);
        }
      }

      if (users.length < 1000) hasMore = false;
      else page++;
    }

    // 2. Scan PROFILES (To catch orphans or profiles without auth users)
    const { data: profiles, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('id, contact_email, username');

    if (profError) throw profError;

    const toDeleteFromProfiles = (profiles || []).filter(p => {
      const email = (p.contact_email || p.username || '').toLowerCase();
      if (email.endsWith('@east.com')) return false;
      const keywords = ['test', 'audit', 'qa', 'verify'];
      return keywords.some(k => email.includes(k));
    });

    for (const p of toDeleteFromProfiles) {
      try {
        await supabaseAdmin.from('engineering_tickets').delete().eq('reporter_id', p.id);
        await supabaseAdmin.from('registrations').delete().or(`user_id.eq.${p.id},payer_id.eq.${p.id}`);
        await supabaseAdmin.from('players_stats').delete().eq('player_id', p.id);
        await supabaseAdmin.from('profiles').delete().eq('id', p.id);
        // Also try to delete auth user just in case it exists but was missed
        await supabaseAdmin.auth.admin.deleteUser(p.id);
        allDeleted.add(p.contact_email || p.username || p.id);
      } catch (err) {
        // Ignore errors if auth user already deleted
      }
    }

    console.log(`Purge complete. Total unique records removed: ${allDeleted.size}`);

    return NextResponse.json({
      success: true,
      count: allDeleted.size,
      deletedEmails: Array.from(allDeleted)
    });

  } catch (error: any) {
    console.error('Purge error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
