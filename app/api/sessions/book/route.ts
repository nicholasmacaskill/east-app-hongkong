// app/api/sessions/book/route.ts (RPC VERSION)

import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { sendEmail } from '@/app/lib/email';

// **********************************************
// 1. GET - Fetches the list of all future sessions
// **********************************************
export async function GET() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}


// **********************************************
// 2. POST - Handles the booking via RPC
// **********************************************
export async function POST(request: Request) {
  const { sessionId, userId, attendeeId } = await request.json();

  if (!sessionId || !userId) {
    return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
  }

  try {
    // 1. Call the Postgres Function (RPC)
    // This handles cost check, balance check, credit deduction, and registration atomically.
    // Updated to support booking for a child (attendeeId)
    const { data: result, error: rpcError } = await supabase.rpc('book_session_with_credits', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_attendee_id: attendeeId || null
    });

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      return NextResponse.json({ error: rpcError.message || 'Database error during booking.' }, { status: 500 });
    }

    // result is JSON: { success: boolean, message: string, new_balance?: number }
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // 2. Send Confirmation Email (Async - don't fail request if this fails)
    // We need to fetch session/user details briefly for the email content if we want it rich.
    // Or we just send a generic one. Let's try to be nice.
    try {
      const { data: session } = await supabase.from('sessions').select('title, start_time, credit_cost').eq('id', sessionId).single();
      const { data: profile } = await supabase.from('profiles').select('contact_email, first_name').eq('id', userId).single();

      if (session && profile && profile.contact_email) {
        await sendEmail({
          to: profile.contact_email,
          subject: `Booking Confirmed: ${session.title}`,
          html: `
                  <p>Hi ${profile.first_name || 'Member'},</p>
                  <p>Your spot is successfully reserved for <strong>${session.title}</strong>.</p>
                  <p><strong>Time:</strong> ${new Date(session.start_time).toLocaleString()}</p>
                  <p>Your booking is confirmed.</p>
                  <p>See you there!</p>
                `
        });
      }
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      // Continue, do not fail the request
    }

    return NextResponse.json({ success: true, message: result.message });

  } catch (e) {
    console.error('API Error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred during booking.' }, { status: 500 });
  }
}