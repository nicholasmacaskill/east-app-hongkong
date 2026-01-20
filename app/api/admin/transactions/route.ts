import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    try {
        // 1. AUTHENTICATION & ROLE CHECK
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'sys-admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. FETCH ALL TRANSACTIONS
        const { data: transactions, error } = await supabaseAdmin
            .from('transactions')
            .select(`
                *,
                profiles:user_id ( first_name, last_name, email:contact_email )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching global transactions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(transactions);

    } catch (e: any) {
        console.error('Global Transactions Server Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
