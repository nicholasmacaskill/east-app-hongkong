// app/api/sessions/cancel/route.ts (DYNAMIC COST)

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { sendEmail } from '@/app/lib/email';

// **********************************************
// DELETE - Handles the cancellation of a session (WRITE & EMAIL)
// **********************************************
export async function DELETE(request: Request) {
  const { sessionId, userId } = await request.json();

  if (!sessionId || !userId) {
    return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
  }

  try {
    // SECURITY NOTE: In a production environment, you must verify that the 'userId' 
    // matches the authenticated user (via Supabase Auth Cookies/Heades) 
    // to prevent unauthorized cancellations.

    // Call the Database RPC function which handles:
    // 1. Checking registration existence
    // 2. Identifying the correct Payer (Parent vs Child)
    // 3. Calculating Refund (Dynamic Cost)
    // 4. Updating Credits & Deleting Registration
    const supabaseAdmin = getSupabaseAdmin();
    const { data: result, error } = await supabaseAdmin.rpc('cancel_session_and_refund', {
      p_attendee_id: userId,
      p_session_id: sessionId
    });

    if (error) {
      console.error('RPC Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Optional: Send Email if successful
    // We can fetch profile here if we want to send email, 
    // or we can rely on DB triggers (better) or keep it simple for now.
    // For now, retaining the email logic would require fetching profile again.
    // Let's keep it simple and reliable first.

    // Attempt to send email asynchronously (non-blocking)
    if (result.success) {
      (async () => {
        try {
          const supabaseAdmin = getSupabaseAdmin();
          const { data: profile } = await supabaseAdmin.from('profiles').select('contact_email, first_name').eq('id', userId).single();
          const { data: session } = await supabaseAdmin.from('sessions').select('title, start_time').eq('id', sessionId).single();
          if (profile?.contact_email && session) {
            await sendEmail({
              to: profile.contact_email,
              subject: `Cancellation Confirmed: ${session.title}`,
              html: `
                          <p>Hi ${profile.first_name || 'Member'},</p>
                          <p>Your booking for <strong>${session.title}</strong> has been cancelled.</p>
                          <p>${result.message}</p>
                        `
            });
          }
        } catch (err) { console.error("Email error", err); }
      })();
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      refundAmount: result.refund_amount,
      newCredits: 0 // Client should refetch profile to get actual new credits
    });

  } catch (e) {
    console.error('API Error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred during cancellation.' }, { status: 500 });
  }
}