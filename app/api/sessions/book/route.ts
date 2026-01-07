// app/api/sessions/book/route.ts (RPC VERSION)

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { sendEmail } from '@/app/lib/email';

// Helper: Dynamic Coach Pricing
function getCoachCost(tier: string, bookingMode: string): number {
  const coachPricing: Record<string, number> = {
    senior: 850,
    junior: 500,
    golf: 1100,
    pt: 700,
    hyrox: 800
  };

  // In coach_only mode, charge full price. In facility mode, may adjust if needed
  return coachPricing[tier] || 750; // Default to 750 if tier not found
}


// **********************************************
// 1. GET - Fetches the list of all future sessions
// **********************************************
export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
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
  bookingMode?: 'facility' | 'coach_only'; // NEW: Differentiate booking types
  coachTier?: 'senior' | 'junior' | 'golf' | 'pt' | 'hyrox'; // NEW: For dynamic pricing
}

export async function POST(request: Request) {
  const { sessionId, userId, attendeeId, attendeeIds, coachId, bookingMode = 'facility', coachTier = 'junior' } = await request.json() as BookingRequest;

  // SECURITY NOTE: In production, verify that 'userId' matches the authenticated user token.
  // Currently, this blindly trusts the client-provided userId.

  if (!sessionId || !userId) {
    return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
  }

  // Normalize to array: usage of single attendeeId or multiple attendeeIds
  const targets = attendeeIds && Array.isArray(attendeeIds) ? attendeeIds : (attendeeId ? [attendeeId] : []);

  // If nothing provided, default to booking the user themselves
  if (targets.length === 0) targets.push(userId);

  console.log(`[BOOKING] Mode: ${bookingMode}, User: ${userId}, Session: ${sessionId}, Targets:`, targets, `Coach: ${coachId}, Tier: ${coachTier}`);

  const results = [];
  let successCount = 0;

  try {
    // 1. Fetch Session Info (for time and type)
    const supabaseAdmin = getSupabaseAdmin();
    const { data: mainSession, error: fetchErr } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchErr || !mainSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // ==========================
    // VALIDATION: Dual Path Logic
    // ==========================
    if (bookingMode === 'facility') {
      // Facility Mode: Check bay availability
      const { count: bayBookings } = await supabaseAdmin
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      const maxBays = mainSession.max_capacity || 999; // Default to unlimited if not set

      if (bayBookings && bayBookings >= maxBays) {
        return NextResponse.json({ error: 'Facility fully booked' }, { status: 400 });
      }

      console.log(`[FACILITY CHECK] Bays occupied: ${bayBookings}/${maxBays}`);
    } else if (bookingMode === 'coach_only' && coachId) {
      // Coach-Only Mode: Only validate coach availability (skip facility checks)
      const { data: coachAvailability, error: availErr } = await supabaseAdmin
        .from('availability')
        .select('*')
        .eq('coach_id', coachId)
        .lte('start_time', mainSession.start_time)
        .gte('end_time', mainSession.end_time);

      if (availErr || !coachAvailability || coachAvailability.length === 0) {
        return NextResponse.json({ error: 'Coach not available at this time' }, { status: 400 });
      }

      console.log(`[COACH CHECK] Coach ${coachId} is available`);
    }

    // 2. Handle Coach Booking (if selected)
    let coachSessionId: number | null = null;
    if (coachId) {
      const { data: coachProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', coachId)
        .single();

      if (coachProfile) {
        // Create a temporary PRIVATE session for this coach
        // Ideally we'd check for existing or use a different model, 
        // but this fits the current 'sessions' based booking RPC.
        const { data: newSess, error: createSessErr } = await supabaseAdmin
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
            credit_cost: getCoachCost(coachTier, bookingMode) // Dynamic pricing
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
      const { data: result, error: rpcError } = await supabaseAdmin.rpc('book_session_with_credits', {
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
          const { data: coachResult, error: coachRpcError } = await supabaseAdmin.rpc('book_session_with_credits', {
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