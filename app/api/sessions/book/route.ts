// app/api/sessions/book/route.ts (RPC VERSION)

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { sendEmail } from '@/app/lib/email';
import { createClient } from '@supabase/supabase-js';

// Helper to verify user against Supabase Auth
async function verifyUser(request: Request, claimedUserId: string): Promise<boolean> {
  // 1. Get Token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');

  // 2. Create restricted client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 3. Verify
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return false;
  return user.id === claimedUserId;
}

// Helper: Dynamic Coach Pricing
function getCoachCost(tier: string, origin: string): number {
  const coachPricing: Record<string, number> = {
    senior: 850,
    junior: 500,
    golf: 1100,
    pt: 700,
    hyrox: 800
  };

  // In coach_only mode (origin = 'coaches'), charge full price.
  // In facility mode (origin = 'facilities'), we also charge full coach price as add-on.
  return coachPricing[tier] || 750;
}


// **********************************************
// 1. GET - Fetches the list of all future sessions
// **********************************************
export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server Error: SUPABASE_SERVICE_ROLE_KEY is missing.' }, { status: 500 });
  }
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .gt('start_time', new Date().toISOString())
    .neq('status', 'voided') // Filter out voided sessions
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
  origin?: 'facilities' | 'coaches'; // UPDATED: Match user request terminology
  coachTier?: 'senior' | 'junior' | 'golf' | 'pt' | 'hyrox';
}

export async function POST(request: Request) {
  try {
    const { sessionId, userId, attendeeId, attendeeIds, coachId, origin = 'facilities', coachTier = 'junior' } = await request.json() as BookingRequest;

    // SECURITY NOTE: In production, verify that 'userId' matches the authenticated user token.
    // Currently, this blindly trusts the client-provided userId.

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
    }

    // Normalize to array: usage of single attendeeId or multiple attendeeIds
    const targets = attendeeIds && Array.isArray(attendeeIds) ? attendeeIds : (attendeeId ? [attendeeId] : []);

    // If nothing provided, default to booking the user themselves
    if (targets.length === 0) targets.push(userId);

    // SECURITY CHECK
    try {
      const isVerified = await verifyUser(request, userId);
      if (!isVerified) {
        console.warn(`[SECURITY WARNING] User ${userId} failed auth check from IP ${request.headers.get('x-forwarded-for') || 'unknown'}`);
        return NextResponse.json({ error: 'Unauthorized: ID mismatch' }, { status: 401 });
      }
    } catch (e: any) {
      console.error('VerifyUser crashed:', e);
      // Fail open or closed? Closed.
      return NextResponse.json({ error: 'Auth Verification Failed: ' + e.message }, { status: 500 });
    }

    console.log(`[BOOKING] Origin: ${origin}, User: ${userId}, Session: ${sessionId}, Targets:`, targets, `Coach: ${coachId}, Tier: ${coachTier}`);

    // 1. Call the Atomic Master Booking RPC
    const supabaseAdmin = getSupabaseAdmin();
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('master_book_atomic', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_attendee_ids: targets,
      p_coach_id: coachId,
      p_coach_tier: coachTier,
      p_origin: origin
    });

    if (rpcError) {
      console.error(`[BOOKING] RPC Error:`, rpcError);
      return NextResponse.json({ error: rpcError.message, details: rpcError }, { status: 500 });
    }

    if (!result.success) {
      console.error(`[BOOKING] Failed: ${result.message}`);
      return NextResponse.json({
        error: result.message,
        code: result.code
      }, { status: result.code === 'INSUFFICIENT_CREDITS' || result.code === 'CAPACITY_MET' ? 400 : 403 });
    }

    console.log(`[BOOKING] Success: ${result.message}`);
    const results = result.results;
    const successCount = targets.length;

    // --- SMART BOOKING EXCLUSIVITY (Soft Void) ---
    // If successfully booked, void overlapping empty sessions for the same instructor
    try {
      if (successCount > 0) {
        const { data: bookedSession } = await supabaseAdmin
          .from('sessions')
          .select('instructor, start_time, end_time')
          .eq('id', sessionId)
          .single();

        if (bookedSession && bookedSession.instructor) {
          // Find conflicting sessions (same instructor, overlaps time, not this session)
          const { data: conflicts } = await supabaseAdmin
            .from('sessions')
            .select('id, registrations(count)')
            .eq('instructor', bookedSession.instructor)
            .neq('id', sessionId)
            .neq('status', 'voided') // Don't re-void
            // Time Overlap Logic: (StartB < EndA) AND (EndB > StartA)
            .lt('start_time', bookedSession.end_time)
            .gt('end_time', bookedSession.start_time);

          if (conflicts && conflicts.length > 0) {
            const idsToVoid = conflicts
              .filter((s: any) => s.registrations?.[0]?.count === 0) // Only void if EMPTY
              .map((s: any) => s.id);

            if (idsToVoid.length > 0) {
              console.log(`[SMART BOOKING] Voiding conflicting empty sessions: ${idsToVoid.join(', ')}`);
              await supabaseAdmin
                .from('sessions')
                .update({ status: 'voided' })
                .in('id', idsToVoid);
            } else {
              console.warn(`[SMART BOOKING] Conflicts found but not voided (they have bookings):`, conflicts.map((s: any) => s.id));
            }
          }
        }
      }
    } catch (voidError) {
      console.error('[SMART BOOKING] Error during post-booking void:', voidError);
      // Do not fail the request, this is a side effect
    }
    // ---------------------------------------------

    // Attempt to send email summary (optional, best effort)
    try {
      if (successCount > 0) {
        // Fetch session info for email
        const { data: mainSession } = await supabaseAdmin.from('sessions').select('*').eq('id', sessionId).single();
        // Find email of user
        const { data: userProfile } = await supabaseAdmin.from('profiles').select('contact_email').eq('id', userId).single();

        if (userProfile?.contact_email && mainSession) {
          await sendEmail({
            to: userProfile.contact_email,
            subject: 'Booking Confirmation - EAST',
            html: `
              <h1>Booking Confirmed</h1>
              <p>You have successfully booked ${successCount} slot(s).</p>
              <p><strong>Session:</strong> ${mainSession.title}</p>
              <p><strong>Time:</strong> ${new Date(mainSession.start_time).toLocaleString()}</p>
              <p>Type: ${origin === 'facilities' ? 'Facility Booking' : 'Coach Booking'}</p>
              <br/>
              <p>Thanks for your booking, please be informed that, if you would like to take a friend, 
              you must register them through our support chat: <a href="https://wa.link/b2y0sa">https://wa.link/b2y0sa</a> 
              (upon approval, credits will be deducted from your account).</p>
            `
          });
        }
      }
    } catch (e) {
      console.error('Email send failed', e);
    }

    return NextResponse.json({
      success: successCount > 0,
      results
    });

  } catch (err: any) {
    console.error('Booking error (Top Level):', err);
    return NextResponse.json({ error: 'Internal server error: ' + (err.message || 'Unknown') }, { status: 500 });
  }
}