import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getRateLimitIdentifier } from '@/app/lib/rateLimit';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';



export async function POST(request: Request) {
    // 1. Rate limiting
    const identifier = getRateLimitIdentifier(request);
    if (!rateLimit(identifier, { windowMs: 60000, maxRequests: 5 })) {
        return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    try {
        const { userId, amount, reason } = await request.json();

        if (!userId || !amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
        }

        // 2. Identity Verification (Crucial)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user || user.id !== userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Patient ID mismatch' }, { status: 403 });
        }

        // 3. Atomic Deduction via RPC
        console.log(`[API] Processing QR Payment: ${amount} credits for ${userId} (${reason})`);

        const supabaseAdmin = getSupabaseAdmin();
        const { data, error: rpcError } = await supabaseAdmin.rpc('deduct_credits', {
            p_user_id: userId,
            p_amount: amount,
            p_reason: reason
        });

        if (rpcError) {
            console.error("[API] RPC Error:", rpcError);
            return NextResponse.json({ success: false, error: rpcError.message }, { status: 500 });
        }

        if (!data.success) {
            return NextResponse.json({ success: false, error: data.message }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: data.message,
            newBalance: data.new_balance
        });

    } catch (e: any) {
        console.error("[API] QR Payment Error:", e);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
