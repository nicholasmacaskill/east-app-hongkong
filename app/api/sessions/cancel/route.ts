// app/api/sessions/cancel/route.ts (DYNAMIC COST)

import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
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
    // 1. FETCH SESSION COST (NEW STEP)
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      // Fetch the cost (assuming the column is named 'credit_cost')
      .select('title, start_time, credit_cost')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or cost unavailable for refund.' }, { status: 404 });
    }

    // 2. CALCULATE REFUND AMOUNT BASED ON TIME
    const now = new Date();
    const startTime = new Date(session.start_time);
    const msUntilStart = startTime.getTime() - now.getTime();
    const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

    let refundMultiplier = 1; // Default 100%
    let policyMessage = "Standard cancellation policy applied.";

    if (hoursUntilStart < 24) {
      refundMultiplier = 0;
      policyMessage = "Cancelled within 24 hours of start time. No credits refunded.";
    } else if (hoursUntilStart < 48) {
      refundMultiplier = 0.5;
      policyMessage = "Cancelled between 24-48 hours of start time. 50% credits refunded.";
    } else {
      policyMessage = "Cancelled more than 48 hours in advance. Full refund.";
    }

    // Use dynamic cost from DB, fallback to 10 if null/undefined
    const cost = session.credit_cost || 10;
    const REFUND_AMOUNT = Math.floor(cost * refundMultiplier);

    // 3. Fetch User Profile and Current Credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, contact_email, first_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    // 4. Remove the Registration
    const { error: deleteError } = await supabase
      .from('registrations')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Failed to delete registration:', deleteError);
      return NextResponse.json({ error: 'Failed to cancel registration in the database.' }, { status: 500 });
    }

    // 5. Refund Credits (if any)
    let newCredits = profile.credits;
    if (REFUND_AMOUNT > 0) {
      newCredits = profile.credits + REFUND_AMOUNT; // Add the credits back
      const { error: creditError } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', userId);

      if (creditError) {
        console.error('Failed to refund credits:', creditError);
        return NextResponse.json({ error: 'Cancellation successful, but failed to refund credits.' }, { status: 500 });
      }
    }

    // 6. Send Cancellation Confirmation Email
    if (profile.contact_email) {
      await sendEmail({
        to: profile.contact_email,
        subject: `Cancellation Confirmed: ${session.title}`,
        html: `
          <p>Hi ${profile.first_name || 'Member'},</p>
          <p>Your booking for <strong>${session.title}</strong> has been successfully cancelled.</p>
          <p>The time was: ${new Date(session.start_time).toLocaleString()}</p>
          <p><strong>Refund Policy Applied:</strong> ${policyMessage}</p>
          <p>We have refunded **${REFUND_AMOUNT}** credits back to your account. You now have **${newCredits}** credits remaining.</p>
          <p>You can book another session anytime!</p>
        `
      });
      console.log(`Cancellation Confirmation Email sent to: ${profile.contact_email}`);
    }

    // Final Success Response
    return NextResponse.json({
      success: true,
      message: policyMessage,
      refundAmount: REFUND_AMOUNT,
      newCredits: newCredits
    });

  } catch (e) {
    console.error('API Error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred during cancellation.' }, { status: 500 });
  }
}