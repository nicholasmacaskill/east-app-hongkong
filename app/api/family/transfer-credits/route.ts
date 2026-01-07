// app/api/family/transfer-credits/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

interface TransferRequest {
    fromUserId: string;
    toUserId: string;
    amount: number;
}

export async function POST(request: Request) {
    try {
        const { fromUserId, toUserId, amount } = await request.json() as TransferRequest;

        if (!fromUserId || !toUserId || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (amount <= 0) {
            return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Call RPC function
        const { data, error } = await supabaseAdmin.rpc('transfer_credits', {
            p_from_user_id: fromUserId,
            p_to_user_id: toUserId,
            p_amount: amount
        });

        if (error) {
            console.error('Transfer error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data.success) {
            return NextResponse.json({ error: data.message }, { status: 400 });
        }

        console.log(`✅ Credits transferred: ${amount} from ${fromUserId} to ${toUserId}`);

        return NextResponse.json({
            success: true,
            ...data
        });

    } catch (error: any) {
        console.error('Transfer API error:', error);
        return NextResponse.json({
            error: 'Failed to transfer credits: ' + error.message
        }, { status: 500 });
    }
}
