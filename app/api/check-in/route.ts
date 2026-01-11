
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getRateLimitIdentifier } from '@/app/lib/rateLimit';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';



export async function POST(request: Request) {
    // 1. Rate limiting
    const identifier = getRateLimitIdentifier(request);
    if (!rateLimit(identifier, { windowMs: 60000, maxRequests: 10 })) {
        return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    try {
        const { userId, locationId, timestamp } = await request.json();

        if (!userId || !locationId) {
            return NextResponse.json({ success: false, error: 'Missing userId or locationId' }, { status: 400 });
        }

        // 2. Identity Verification
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
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        // 3. Record Check-in
        console.log(`[API] Processing Check-In for User: ${userId} at ${locationId}`);

        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin
            .from('check_ins')
            .insert({
                user_id: userId,
                location_id: locationId
            });

        if (error) {
            console.error("[API] Check-in DB Error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Check-In successful' });

    } catch (e: any) {
        console.error("[API] Check-in Server Error:", e);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
