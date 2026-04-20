import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { checkRateLimit, paymentRateLimit, getClientIdentifier } from '@/app/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/charge-via-qr
 *
 * Admin-only endpoint: scan a member's wallet QR and deduct credits from their account.
 * The caller must be an authenticated sys-admin or admin — NOT self-pay.
 *
 * Body: { targetUserId: string, amount: number, reason: string }
 */
export async function POST(request: Request) {
    // 1. Rate limiting
    const identifier = getClientIdentifier(request);
    const { success, response } = await checkRateLimit(identifier, paymentRateLimit);
    if (!success && response) return response;

    try {
        const { targetUserId, amount, reason } = await request.json();

        if (!targetUserId || !amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid payload: targetUserId and positive amount required' },
                { status: 400 }
            );
        }

        // 2. Verify the CALLER is an admin/sys-admin (not the member themselves)
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
        }

        const supabaseClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user: callerUser }, error: authError } = await supabaseClient.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (authError || !callerUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 3. Verify caller role in DB (never trust client-side role)
        const supabaseAdmin = getSupabaseAdmin();
        const { data: callerProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', callerUser.id)
            .single();

        if (profileError || !callerProfile) {
            return NextResponse.json({ success: false, error: 'Could not verify caller profile' }, { status: 403 });
        }

        const allowedRoles = ['sys-admin', 'admin'];
        if (!allowedRoles.includes(callerProfile.role)) {
            console.warn(`[CHARGE-VIA-QR] Unauthorized role attempt: ${callerProfile.role} (user: ${callerUser.id})`);
            return NextResponse.json(
                { success: false, error: 'Forbidden: Admin or Sys-Admin role required' },
                { status: 403 }
            );
        }

        // 4. Verify target member exists
        const { data: targetProfile, error: targetError } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, last_name, credits')
            .eq('id', targetUserId)
            .single();

        if (targetError || !targetProfile) {
            return NextResponse.json({ success: false, error: 'Target member not found' }, { status: 404 });
        }

        // 5. Atomic credit deduction via RPC (same as pay-via-qr)
        console.log(
            `[CHARGE-VIA-QR] Admin ${callerUser.id} (${callerProfile.role}) charging ` +
            `${amount} credits from member ${targetUserId} for: "${reason}"`
        );

        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('deduct_credits', {
            p_user_id: targetUserId,
            p_amount: amount,
            p_reason: reason || 'Admin QR charge'
        });

        if (rpcError) {
            console.error('[CHARGE-VIA-QR] RPC Error:', rpcError);
            return NextResponse.json({ success: false, error: rpcError.message }, { status: 500 });
        }

        if (!rpcResult?.success) {
            return NextResponse.json({ success: false, error: rpcResult?.message || 'Deduction failed' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: rpcResult.message,
            memberName: `${targetProfile.first_name} ${targetProfile.last_name}`,
            newBalance: rpcResult.new_balance,
            chargedAmount: amount,
            reason
        });

    } catch (e: any) {
        console.error('[CHARGE-VIA-QR] Server Error:', e);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
