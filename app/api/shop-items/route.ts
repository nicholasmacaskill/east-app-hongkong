import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Now query shop_items using the authenticated user context (RLS handles filtering)
    // Wait, the client is initialized with ANON key, but if we query with it right now,
    // it won't be using the user's JWT automatically unless we set it on the client or pass it.
    // However, the best way to do this in the app is just to query the DB directly using the client's current session or 
    // simply use the admin client since this is a public list of items (active=true). 
    // Let's use the admin client to bypass the need to mock the JWT, but only return active items.
    
    // Better yet: we just return all active items using the admin client because ANY authenticated user is allowed to see them anyway.
    const { getSupabaseAdmin } = require('@/app/lib/supabaseAdmin');
    const supabaseAdmin = getSupabaseAdmin();
    
    const { data, error } = await supabaseAdmin
        .from('shop_items')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
