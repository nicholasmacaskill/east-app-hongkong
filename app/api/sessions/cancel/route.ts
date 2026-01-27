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
    // Calcluate Refund Eligibility
    const supabaseAdmin = getSupabaseAdmin();

    // 31: deleted

    // 1. Fetch Session Details (Start/End) to find linked bookings
    const { data: mainSession, error: sessError } = await supabaseAdmin
      .from('sessions')
      .select('start_time, end_time, title, instructor')
      .eq('id', sessionId)
      .single();

    if (sessError || !mainSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 2. Find ALL Linked Sessions (Same User, Same Time)
    // This catches "Facility" + "Private Coach" booked together
    const { data: linkedBookings } = await supabaseAdmin
      .from('registrations')
      .select('session_id, sessions!inner(start_time, end_time)')
      .eq('user_id', userId)
      .eq('sessions.start_time', mainSession.start_time)
      .eq('sessions.end_time', mainSession.end_time);

    // Collect IDs (Default to just the requested one if query fails / returns empty)
    const distinctIds = new Set<number>([sessionId]);
    if (linkedBookings) {
      linkedBookings.forEach(r => distinctIds.add(r.session_id));
    }
    const sessionsToCancel = Array.from(distinctIds);

    console.log(`[CANCEL] Found Linked Sessions for User ${userId}:`, sessionsToCancel);

    const cancelResults = [];

    // 3. Process Cancellation for EACH linked session
    for (const targetSesId of sessionsToCancel) {

      // A. Calculate Refund Validity
      const startTime = new Date(mainSession.start_time).getTime();
      const now = Date.now();
      const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

      let refundMultiplier = 1;
      if (hoursUntilStart < 24) refundMultiplier = 0;
      else if (hoursUntilStart < 48) refundMultiplier = 0.5;

      // B. Check PAID amount for THIS specific session
      const { data: reg } = await supabaseAdmin
        .from('registrations')
        .select('credits_paid')
        .eq('user_id', userId)
        .eq('session_id', targetSesId)
        .single();

      let refundAmount = 0;
      if (reg) {
        const originalPaid = reg.credits_paid || 0;
        refundAmount = Math.floor(originalPaid * refundMultiplier);

        console.log(`[CANCEL] ID ${targetSesId}: Paid ${originalPaid}, Refund ${refundAmount} (Mult: ${refundMultiplier})`);
      }

      // C. Execute Cancellation RPC with Explicit Refund Amount
      const { data: result, error } = await supabaseAdmin.rpc('cancel_session_and_refund_v2', {
        p_attendee_id: userId,
        p_session_id: targetSesId,
        p_refund_amount: refundAmount
      });

      if (error) {
        console.error(`[CANCEL] Failed for ${targetSesId}:`, error);
        cancelResults.push({ id: targetSesId, success: false, message: error.message });
      } else {
        cancelResults.push({ id: targetSesId, success: result.success, message: result.message, refund: result.refund_amount });
      }
    }

    const overallSuccess = cancelResults.some(r => r.success);
    const successMessages = cancelResults.filter(r => r.success).map(r => r.message).join(' | ');
    const totalRefund = cancelResults.reduce((sum, r) => sum + (r.refund || 0), 0);

    // Optional: Send Email if successful (Async)
    if (overallSuccess) {
      (async () => {
        try {
          const supabaseAdminAsync = getSupabaseAdmin();
          const { data: profile } = await supabaseAdminAsync.from('profiles').select('contact_email, first_name').eq('id', userId).single();
          const { data: session } = await supabaseAdminAsync.from('sessions').select('title, start_time').eq('id', sessionId).single();
          if (profile?.contact_email && session) {
            await sendEmail({
              to: profile.contact_email,
              subject: `Cancellation Confirmed: ${session.title}`,
              html: `
                <p>Hi ${profile.first_name || 'Member'},</p>
                <p>Your booking for <strong>${session.title}</strong> has been cancelled.</p>
                <p>${successMessages}</p>
                <p>Refunded: ${totalRefund} Credits</p>
              `
            });
          }
        } catch (err) { console.error("Email error", err); }
      })();
    }

    // --- SMART EXCLUSIVITY RESTORATION ---
    // If successfully cancelled, restore voided sessions for the same instructor/time
    if (overallSuccess && mainSession?.instructor) {
      try {
        const supabaseAdminRestore = getSupabaseAdmin(); // Use fresh client for background task
        const { data: voidedSessions } = await supabaseAdminRestore
          .from('sessions')
          .select('id')
          .eq('instructor', mainSession.instructor)
          .eq('status', 'voided')
          // Time Overlap Logic: (StartB < EndA) AND (EndB > StartA)
          .lt('start_time', mainSession.end_time)
          .gt('end_time', mainSession.start_time);

        if (voidedSessions && voidedSessions.length > 0) {
          const idsToRestore = voidedSessions.map((s: any) => s.id);
          console.log(`[SMART RESTORE] Restoring voided sessions: ${idsToRestore.join(', ')}`);
          await supabaseAdminRestore
            .from('sessions')
            .update({ status: 'active' })
            .in('id', idsToRestore);
        }
      } catch (restoreErr) {
        console.error('[SMART RESTORE] Error:', restoreErr);
      }
    }
    // -------------------------------------

    return NextResponse.json({
      success: overallSuccess,
      message: successMessages || 'Cancellation processed',
      refundAmount: totalRefund,
      details: cancelResults
    });

  } catch (e) {
    console.error('API Error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred during cancellation.' }, { status: 500 });
  }
}