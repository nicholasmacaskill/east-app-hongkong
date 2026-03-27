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
      .select('id, contact_email, username, first_name, last_name');

    if (profError) throw profError;

    const keywords = ['test', 'audit', 'qa', 'verify'];
    const toDeleteFromProfiles = (profiles || []).filter(p => {
      const email = (p.contact_email || '').toLowerCase();
      const user = (p.username || '').toLowerCase();
      const first = (p.first_name || '').toLowerCase();
      const last = (p.last_name || '').toLowerCase();
      
      if (email.endsWith('@east.com') || user.endsWith('@east.com')) {
         // CRITICAL: Still protect corporate @east.com unless it's a known test email
         // and doesn't exactly match the admin account
         if (email === 'admin@east.com') return false;
      }

      const match = keywords.some(k => 
        email.includes(k) || 
        user.includes(k) || 
        first.includes(k) || 
        last.includes(k)
      );

      return match;
    });

    console.log(`Deep-Scan found ${toDeleteFromProfiles.length} matching profiles for keyword purge.`);

    for (const p of toDeleteFromProfiles) {
      try {
        console.log(`Purging Profile: ${p.id} | Email: ${p.contact_email} | Name: ${p.first_name} ${p.last_name}`);
        
        // Scrub dependents
        await supabaseAdmin.from('engineering_tickets').delete().eq('reporter_id', p.id);
        await supabaseAdmin.from('registrations').delete().or(`user_id.eq.${p.id},payer_id.eq.${p.id}`);
        await supabaseAdmin.from('players_stats').delete().eq('player_id', p.id);
        
        // Remove Profile
        const { error: pErr } = await supabaseAdmin.from('profiles').delete().eq('id', p.id);
        if (pErr) console.error(`Failed to delete profile record for ${p.id}:`, pErr.message);

        // Remove Auth
        const { error: aErr } = await supabaseAdmin.auth.admin.deleteUser(p.id);
        if (aErr && aErr.status !== 404) console.error(`Failed to delete auth user for ${p.id}:`, aErr.message);

        allDeleted.add(p.contact_email || p.username || p.id);
      } catch (err: any) {
        console.error(`Deep-Scan purge process error for ${p.id}:`, err.message);
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
