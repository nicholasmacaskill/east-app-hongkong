import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { userId, amount, description } = await request.json();

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

        // 2. FETCH TARGET USER CURRENT CREDITS
        const { data: targetProfile, error: targetError } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (targetError || !targetProfile) {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
        }

        const newCredits = Math.max(0, (targetProfile.credits || 0) + amount);

        // 3. UPDATE CREDITS
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId);

        if (updateError) throw updateError;

        // 4. LOG TRANSACTION
        const { error: logError } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: userId,
                amount: amount,
                type: 'transfer',
                description: description || `Manual adjustment by admin (${user.email})`
            });

        if (logError) {
            console.error('Transaction Log Error:', logError);
            // We don't necessarily want to fail the whole request if logging fails, 
            // but for tests we want to know.
            throw logError;
        }

        return NextResponse.json({ success: true, newCredits });

    } catch (e: any) {
        console.error('Adjust Credits Error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
