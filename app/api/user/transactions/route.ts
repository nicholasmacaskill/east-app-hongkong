import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET(request: Request) {
    try {
        // 1. Get user session from cookie
        const authHeader = request.headers.get('Authorization');
        let user;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
            if (authError || !authUser) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
            user = authUser;
        } else {
            // Fallback for non-bearer auth if needed
            const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
            if (sessionError || !sessionUser) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
            user = sessionUser;
        }

        // 2. Fetch Transactions using ADMIN client to guarantee visibility
        // Joined with sessions to get the start_time and title for bookings/refunds
        const supabaseAdmin = getSupabaseAdmin();
        const { data: transactions, error: dbError } = await supabaseAdmin
            .from('transactions')
            .select(`
                *,
                sessions (
                    start_time,
                    title
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (dbError) {
            console.error("Error fetching transactions:", dbError);
            return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, transactions });

    } catch (error: any) {
        console.error("Critical error in transactions API:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
