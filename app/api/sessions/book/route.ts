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
// Define expected payload
interface BookingRequest {
  sessionId: number;
  userId: string;
  attendeeId?: string;
  attendeeIds?: string[];
}

export async function POST(request: Request) {
  const { sessionId, userId, attendeeId, attendeeIds } = await request.json() as BookingRequest;

  // SECURITY NOTE: In production, verify that 'userId' matches the authenticated user token.
  // Currently, this blindly trusts the client-provided userId.

  if (!sessionId || !userId) {
    return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
  }

  // Normalize to array: usage of single attendeeId or multiple attendeeIds
  const targets = attendeeIds && Array.isArray(attendeeIds) ? attendeeIds : (attendeeId ? [attendeeId] : []);

  // If nothing provided, default to booking the user themselves
  if (targets.length === 0) targets.push(userId);

  console.log(`Booking for User: ${userId}, Session: ${sessionId}, Targets:`, targets);

  const results = [];
  let successCount = 0;

  try {
    // Iterate and book each
    for (const targetId of targets) {
      console.log(`Processing target: ${targetId}`);
      const { data: result, error: rpcError } = await supabase.rpc('book_session_with_credits', {
        p_user_id: userId, // Payer is always the logged-in user
        p_session_id: sessionId,
        p_attendee_id: targetId
      });

      if (rpcError) {
        console.error(`RPC Error for ${targetId}:`, rpcError);
        results.push({ attendeeId: targetId, success: false, error: rpcError.message });
      } else if (!result.success) {
        results.push({ attendeeId: targetId, success: false, error: result.message });
      } else {
        successCount++;
        results.push({ attendeeId: targetId, success: true, message: result.message });
      }
    }

    // Determine overall response
    if (successCount === 0) {
      // If ALL failed, return error (using the first error message for simplicity, or generic)
      const firstError = results[0]?.error || 'Booking failed.';
      return NextResponse.json({ error: firstError, details: results }, { status: 400 });
    }

    // Partial or Full Success
    return NextResponse.json({
      success: true,
      message: `Successfully booked ${successCount} session(s).`,
      results
    });

  } catch (e) {
    console.error('API Error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred during booking.' }, { status: 500 });
  }
}