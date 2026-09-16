import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

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

    const PROTECTED_EMAILS = [
      'admin@east.com',
      'rick@dynevents.com',
      'nicholasmacaskill@proton.me'
    ];

    const keywords = ['test', 'audit', 'qa', 'verify', 'event watcher', 'assess'];

    const cleanupUserDependencies = async (userId: string) => {
      await Promise.allSettled([
        supabaseAdmin.from('engineering_tickets').delete().eq('reporter_id', userId),
        supabaseAdmin.from('registrations').delete().or(`user_id.eq.${userId},payer_id.eq.${userId}`),
        supabaseAdmin.from('player_relationships').delete().or(`parent_id.eq.${userId},child_id.eq.${userId}`),
        supabaseAdmin.from('players_stats').update({ verified_by: null }).eq('verified_by', userId),
        supabaseAdmin.from('players_stats').delete().eq('player_id', userId),
        supabaseAdmin.from('player_assessments').delete().or(`coach_id.eq.${userId},player_id.eq.${userId}`),
        supabaseAdmin.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
        supabaseAdmin.from('coach_services').delete().eq('coach_id', userId),
        supabaseAdmin.from('voice_commands').delete().eq('coach_id', userId),
        supabaseAdmin.from('availability').delete().eq('coach_id', userId),
        supabaseAdmin.from('notifications').delete().eq('user_id', userId),
        supabaseAdmin.from('transactions').delete().eq('user_id', userId),
        supabaseAdmin.from('likes').delete().eq('user_id', userId),
        supabaseAdmin.from('posts').delete().eq('user_id', userId),
        supabaseAdmin.from('announcements').delete().eq('created_by', userId),
        supabaseAdmin.from('admin_audit_logs').delete().eq('admin_id', userId)
      ]);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
    };

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
        if (PROTECTED_EMAILS.includes(email)) return false;

        const meta = u.user_metadata || {};
        const first = (meta.first_name || '').toLowerCase();
        const last = (meta.last_name || '').toLowerCase();
        const fullName = `${first} ${last}`.trim();

        return keywords.some(k => {
          const kClean = k.replace(/\s+/g, '');
          return email.includes(k) ||
                 email.includes(kClean) ||
                 first.includes(k) ||
                 last.includes(k) ||
                 fullName.includes(k);
        });
      });

      for (const u of toDeleteFromAuth) {
        try {
          await cleanupUserDependencies(u.id);
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

    const toDeleteFromProfiles = (profiles || []).filter(p => {
      const email = (p.contact_email || '').toLowerCase();
      const user = (p.username || '').toLowerCase();
      const first = (p.first_name || '').toLowerCase();
      const last = (p.last_name || '').toLowerCase();
      const fullName = `${first} ${last}`.trim();
      
      if (PROTECTED_EMAILS.includes(email) || PROTECTED_EMAILS.includes(user)) {
        return false;
      }

      const match = keywords.some(k => {
        const kClean = k.replace(/\s+/g, '');
        return email.includes(k) || 
               email.includes(kClean) ||
               user.includes(k) || 
               user.includes(kClean) ||
               first.includes(k) || 
               last.includes(k) ||
               fullName.includes(k);
      });

      return match;
    });

    console.log(`Deep-Scan found ${toDeleteFromProfiles.length} matching profiles for keyword purge.`);

    for (const p of toDeleteFromProfiles) {
      try {
        console.log(`Purging Profile: ${p.id} | Email: ${p.contact_email} | Name: ${p.first_name} ${p.last_name}`);
        
        await cleanupUserDependencies(p.id);

        // Remove Auth
        const { error: aErr } = await supabaseAdmin.auth.admin.deleteUser(p.id);
        if (aErr && (aErr as any).status !== 404) console.error(`Failed to delete auth user for ${p.id}:`, aErr.message);

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
