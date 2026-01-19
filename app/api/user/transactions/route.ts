import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    try {
        // 1. Authenticate check (standard for user routes)
        // We use the client-side token passed in headers usually, but here we can just verify headers
        // actually easier to use standard supabase server client pattern if available, 
        // but for now let's rely on the client passing the token or session validation.

        // Simpler approach compatible with other routes in this project:
        // Extract auth token from header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        // 2. Fetch Transactions
        const { data: transactions, error: dbError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (dbError) {
            console.error("Error fetching transactions:", dbError);
            return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, transactions });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
