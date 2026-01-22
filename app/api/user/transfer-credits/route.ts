import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { recipientId, amount } = body;

        if (!recipientId || !amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
        }

        // Initialize Supabase Client for Auth Check
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Use ADMIN client to call RPC since we already verified the user
        // and the RPC needs higher permissions than ANON (where it's currently failing)
        const { getSupabaseAdmin } = await import('@/app/lib/supabaseAdmin');
        const supabaseAdmin = getSupabaseAdmin();

        const { data, error } = await supabaseAdmin.rpc('transfer_credits', {
            p_from_user_id: user.id,
            p_to_user_id: recipientId,
            p_amount: amount
        });

        if (error) {
            console.error('Transfer error:', error);
            // The RPC returns { success: false, message: ... } on logic errors, 
            // but if it throws (e.g. permission), it comes here.
            // Wait, the RPC acts as a function, so `data` will contain the JSON result if it didn't crash.
            // If it crashed, `error` is populated.
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        // RPC returns a JSON object like { success: true, ... }
        if (data && !data.success) {
            return NextResponse.json({ success: false, error: data.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
