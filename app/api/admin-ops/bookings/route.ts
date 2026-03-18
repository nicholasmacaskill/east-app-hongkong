import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { } } }
        );

        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify role
        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'sys-admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch transactions created by this user
        // We join with profiles (the customer) and sessions
        const { data: transactions, error: transError } = await supabaseAdmin
            .from('transactions')
            .select(`
                *,
                profiles(first_name, last_name, email),
                sessions(title, start_time)
            `)
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

        if (transError) throw transError;

        return NextResponse.json(transactions);
    } catch (error: any) {
        console.error("Fetch admin bookings error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
