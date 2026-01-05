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
  coachId?: string | null;
}

export async function POST(request: Request) {
  const { sessionId, userId, attendeeId, attendeeIds, coachId } = await request.json() as BookingRequest;

  // SECURITY NOTE: In production, verify that 'userId' matches the authenticated user token.
  // Currently, this blindly trusts the client-provided userId.

  if (!sessionId || !userId) {
    return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
  }

  // Normalize to array: usage of single attendeeId or multiple attendeeIds
  const targets = attendeeIds && Array.isArray(attendeeIds) ? attendeeIds : (attendeeId ? [attendeeId] : []);

  // If nothing provided, default to booking the user themselves
  if (targets.length === 0) targets.push(userId);

  console.log(`Booking for User: ${userId}, Session: ${sessionId}, Targets:`, targets, `Coach: ${coachId}`);

  const results = [];
  let successCount = 0;

  try {
    // 1. Fetch Session Info (for time and type)
    const { data: mainSession, error: fetchErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchErr || !mainSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 2. Handle Coach Booking (if selected)
    let coachSessionId: number | null = null;
    if (coachId) {
      const { data: coachProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', coachId)
        .single();

      if (coachProfile) {
        // Create a temporary PRIVATE session for this coach
        // Ideally we'd check for existing or use a different model, 
        // but this fits the current 'sessions' based booking RPC.
        const { data: newSess, error: createSessErr } = await supabase
          .from('sessions')
          .insert({
            title: `Private with ${coachProfile.first_name}`,
            category: 'PRIVATE',
            instructor: `${coachProfile.first_name} ${coachProfile.last_name || ''}`.trim(),
            start_time: mainSession.start_time,
            end_time: mainSession.end_time,
            image_url: mainSession.image_url,
            coach_image_url: coachProfile.avatar_url,
            description: `Private coaching during ${mainSession.title}`,
            credit_cost: 750 // Hardcoded add-on cost
          })
          .select()
          .single();

        if (!createSessErr && newSess) {
          coachSessionId = newSess.id;
        } else {
          console.error("Failed to create coach session:", createSessErr);
        }
      }
    }

    // 3. Iterate and book each target for the MAIN session
    for (const targetId of targets) {
      const { data: result, error: rpcError } = await supabase.rpc('book_session_with_credits', {
        p_user_id: userId,
        p_session_id: sessionId,
        p_attendee_id: targetId
      });

      if (rpcError) {
        results.push({ attendeeId: targetId, type: 'facility', success: false, error: rpcError.message });
      } else if (!result.success) {
        results.push({ attendeeId: targetId, type: 'facility', success: false, error: result.message });
      } else {
        successCount++;
        results.push({ attendeeId: targetId, type: 'facility', success: true, message: result.message });

        // 4. Also book the COACH SESSION for this same target if it was created
        if (coachSessionId) {
          const { data: coachResult, error: coachRpcError } = await supabase.rpc('book_session_with_credits', {
            p_user_id: userId,
            p_session_id: coachSessionId,
            p_attendee_id: targetId
          });

          if (!coachRpcError && coachResult.success) {
            results.push({ attendeeId: targetId, type: 'coach', success: true, message: 'Coach added!' });
          } else {
            results.push({ attendeeId: targetId, type: 'coach', success: false, error: coachRpcError?.message || coachResult?.message });
          }
        }
      }
    }

    // Determine overall response
    if (successCount === 0) {
      const firstError = results[0]?.error || 'Booking failed.';
      return NextResponse.json({ error: firstError, details: results }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully booked ${successCount} session(s)${coachSessionId ? ' with coach' : ''}.`,
      results
    });

  } catch (e) {
    console.error('API Error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred during booking.' }, { status: 500 });
  }
}