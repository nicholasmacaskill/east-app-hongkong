// app/api/admin/sessions/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { logAdminAction } from '@/app/lib/audit';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, id, sessionData } = body;

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseAdmin = getSupabaseAdmin();

        if (action === 'CREATE') {
            const inputs = Array.isArray(sessionData) ? sessionData : [sessionData];

            // Map strictly to schema columns to avoid 'column does not exist' errors
            const recordsToInsert = inputs.map((s: any) => ({
                title: s.title,
                description: s.description,
                image_url: s.image_url,
                start_time: s.start_time,
                end_time: s.end_time,
                category: s.category,
                instructor: s.instructor,
                max_capacity: s.max_capacity,
                credit_cost: s.credit_cost,
                coach_image_url: s.coach_image_url,
                // Include facility_id if needed, but ensure column exists.
                // total_facility_bays is NOT a column in schema usually.
                session_type_id: s.session_type_id || null
            }));

            const { data, error } = await supabaseAdmin
                .from('sessions')
                .insert(recordsToInsert)
                .select();

            if (error) throw error;

            // Audit Logging
            for (const rec of data) {
                await logAdminAction(user.id, 'CREATE_SESSION', 'session', rec.id, rec);
            }

            return NextResponse.json({ success: true, count: data.length, data });
        }

        if (action === 'EDIT' || action === 'UPDATE') {
            if (!id) return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
            const { data, error } = await supabaseAdmin
                .from('sessions')
                .update({
                    title: sessionData.title,
                    description: sessionData.description,
                    image_url: sessionData.image_url,
                    start_time: sessionData.start_time,
                    end_time: sessionData.end_time,
                    category: sessionData.category,
                    instructor: sessionData.instructor,
                    max_capacity: sessionData.max_capacity,
                    credit_cost: sessionData.credit_cost,
                    coach_image_url: sessionData.coach_image_url
                })
                .eq('id', id)
                .select();

            if (error) throw error;

            // Audit Logging
            await logAdminAction(user.id, 'UPDATE_SESSION', 'session', id, sessionData);

            return NextResponse.json({ success: true, data });
        }

        if (action === 'DELETE') {
            if (!id) return NextResponse.json({ error: 'ID is required for delete' }, { status: 400 });

            // Fetch session details for refund calculation
            const { data: session } = await supabaseAdmin
                .from('sessions')
                .select('start_time, title')
                .eq('id', id)
                .single();

            // Soft delete: set status to cancelled
            const { error } = await supabaseAdmin
                .from('sessions')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (error) throw error;

            // Fetch all registrations for this session to process refunds
            const { data: registrations } = await supabaseAdmin
                .from('registrations')
                .select('id, user_id, payer_id, credits_paid')
                .eq('session_id', id)
                .neq('status', 'cancelled'); // Only active registrations

            // Process refunds for each registration
            if (registrations && registrations.length > 0 && session) {
                const startTime = new Date(session.start_time).getTime();
                const now = Date.now();
                const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

                // Calculate refund multiplier based on cancellation policy
                let refundMultiplier = 1;
                if (hoursUntilStart < 24) refundMultiplier = 0;
                else if (hoursUntilStart < 48) refundMultiplier = 0.5;

                for (const reg of registrations) {
                    const payerId = reg.payer_id || reg.user_id;
                    const refundAmount = Math.floor((reg.credits_paid || 0) * refundMultiplier);

                    if (refundAmount > 0) {
                        // Refund credits to payer
                        await supabaseAdmin
                            .from('profiles')
                            .update({ credits: supabaseAdmin.raw(`credits + ${refundAmount}`) })
                            .eq('id', payerId);

                        // Log transaction
                        await supabaseAdmin
                            .from('transactions')
                            .insert({
                                user_id: payerId,
                                amount: refundAmount,
                                type: 'refund',
                                description: `Admin cancelled: ${session.title} (${refundMultiplier * 100}% refund)`
                            });
                    }
                }
            }

            // Mark all registrations for this session as cancelled
            const { error: regError } = await supabaseAdmin
                .from('registrations')
                .update({ status: 'cancelled' })
                .eq('session_id', id);

            if (regError) console.warn('Failed to cancel registrations for session:', id, regError);

            // Audit Logging
            await logAdminAction(user.id, 'DELETE_SESSION', 'session', id);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Sessions API error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
