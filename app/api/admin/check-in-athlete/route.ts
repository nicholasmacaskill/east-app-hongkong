import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { checkRateLimit, apiRateLimit, getClientIdentifier } from '@/app/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/check-in-athlete
 * 
 * Admin-only endpoint: log a member's entry into the gym without charging credits.
 * 
 * Body: { userId: string, locationId?: string }
 */
export async function POST(request: Request) {
    // 1. Rate limiting
    const identifier = getClientIdentifier(request);
    const { success, response } = await checkRateLimit(identifier, apiRateLimit);
    if (!success && response) return response;

    try {
        const { userId, locationId } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
        }

        // 2. Verify the CALLER is an admin/sys-admin
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

        // 3. Verify caller role in DB
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
            return NextResponse.json({ success: false, error: 'Forbidden: Admin role required' }, { status: 403 });
        }

        // 4. Record Check-in for the TARGET user
        console.log(`[API] Admin ${callerUser.id} logging entry for Athlete: ${userId}`);

        const { error } = await supabaseAdmin
            .from('check_ins')
            .insert({
                user_id: userId,
                location_id: locationId || 'Main Gym'
            });

        if (error) {
            console.error("[API] Check-in entry Error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Entry logged successfully' 
        });

    } catch (e: any) {
        console.error("[API] Admin Check-in Server Error:", e);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
