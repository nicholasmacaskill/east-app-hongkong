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
        // CRITICAL: Protect the main admin account from the purge
        if (email === 'admin@east.com') return false;
        
        // Criteria: includes 'test', includes 'audit', or ends with @east.com
        return email.includes('test') || email.includes('audit') || email.endsWith('@east.com');
      });

      for (const u of toDelete) {
        const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(u.id);
        if (!delError) {
          allDeleted.push(u.email);
        } else {
          console.error(`Failed to delete ${u.email}:`, delError.message);
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
