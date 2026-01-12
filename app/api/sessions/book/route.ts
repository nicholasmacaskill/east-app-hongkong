// app/api/sessions/book/route.ts (RPC VERSION)

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { sendEmail } from '@/app/lib/email';

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

  console.log(`[BOOKING] Origin: ${origin}, User: ${userId}, Session: ${sessionId}, Targets:`, targets, `Coach: ${coachId}, Tier: ${coachTier}`);

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
    // SECURITY: Check Subscription
    // ==========================
    const { data: userProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status, parent_id')
      .eq('id', userId)
      .single();

    if (profileErr || !userProfile) {
      // It might be a child profile in the 'players' table or just missing?
      // Let's check if it's a child by looking up 'profiles' (maybe they are a profile with parent_id)
      // If not found in profiles, we can't check subscription easily.
      // BUT, let's assume if not found, we return 404. 
      // However, if found, we check parent_id.
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    let subscriptionStatus = userProfile.subscription_status;

    // Handle Child Accounts: If this user has a parent, check parent's subscription
    if (userProfile.parent_id) {
      const { data: parentProfile } = await supabaseAdmin
        .from('profiles')
        .select('subscription_status')
        .eq('id', userProfile.parent_id)
        .single();

      if (parentProfile) {
        subscriptionStatus = parentProfile.subscription_status;
      }
    }

    if (subscriptionStatus !== 'active' && subscriptionStatus !== 'trialing') {
      return NextResponse.json({ error: 'Account Locked: Active subscription required.', code: 'SUBSCRIPTION_LOCKED' }, { status: 403 });
    }



    // ==========================
    // VALIDATION: Origin Logic
    // ==========================
    if (origin === 'facilities') {
      // 1. "Facilities": Verify Bay session_id availability
      const { count: bayBookings } = await supabaseAdmin
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      const maxBays = mainSession.max_capacity || 999;

      if (bayBookings && bayBookings >= maxBays) {
        return NextResponse.json({ error: 'Facility fully booked' }, { status: 400 });
      }

      // 2. If coach attached, verify coach availability
      if (coachId) {
        const { data: coachAvailability, error: availErr } = await supabaseAdmin
          .from('availability')
          .select('*')
          .eq('coach_id', coachId)
          .lte('start_time', mainSession.start_time)
          .gte('end_time', mainSession.end_time);

        if (availErr || !coachAvailability || coachAvailability.length === 0) {
          return NextResponse.json({ error: 'Coach not available' }, { status: 400 });
        }
      }

    } else if (origin === 'coaches' && coachId) {
      // "Our Coaches": Bypass Bay Checks. Validate Coach Only.
      const { data: coachAvailability, error: availErr } = await supabaseAdmin
        .from('availability')
        .select('*')
        .eq('coach_id', coachId)
        .lte('start_time', mainSession.start_time)
        .gte('end_time', mainSession.end_time);

      if (availErr || !coachAvailability || coachAvailability.length === 0) {
        return NextResponse.json({ error: 'Coach not available at this time' }, { status: 400 });
      }
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
        // ideally in a real system we might not create a session row every time, 
        // but this allows us to track it in registrations linking to a session_id
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
            credit_cost: getCoachCost(coachTier, origin) // Dynamic pricing
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

    // 3. Iterate and book each target
    for (const targetId of targets) {

      let facilitySuccess = true;

      // A. BOOK FACILITY SESSION (Only if origin === 'facilities')
      if (origin === 'facilities') {
        console.log(`[BOOKING] Calling book_session_with_credits for User ${userId}, Session ${sessionId}, Attendee ${targetId}`);
        const { data: result, error: rpcError } = await supabaseAdmin.rpc('book_session_with_credits', {
          p_user_id: userId,
          p_session_id: sessionId,
          p_attendee_id: targetId
        });

        console.log(`[BOOKING] RPC Result:`, result);
        if (rpcError) console.error(`[BOOKING] RPC Error:`, rpcError);

        if (rpcError || !result.success) {
          console.error(`[BOOKING] Failed: ${rpcError?.message || result?.message}`);
          results.push({ attendeeId: targetId, type: 'facility', success: false, error: rpcError?.message || result?.message });
          facilitySuccess = false;
        } else {
          console.log(`[BOOKING] Success confirmed.`);

          // CRITICAL FIX: Manually record credits_paid because DB function defaults to 0
          // This ensures refunds work correctly (Reading credits_paid column)
          const cost = mainSession.credit_cost || 0;
          if (cost > 0) {
            const { error: patchError } = await supabaseAdmin
              .from('registrations')
              .update({ credits_paid: cost })
              .eq('user_id', targetId)
              .eq('session_id', sessionId);

            if (patchError) console.error("Failed to patch credits_paid:", patchError);
            else console.log(`[BOOKING] patched credits_paid to ${cost}`);
          }

          results.push({ attendeeId: targetId, type: 'facility', success: true, message: result.message });
        }
      } else {
        // Coach Only flow - assume "facility" part is passed/skipped
        facilitySuccess = true;
      }

      if (facilitySuccess) {
        if (origin === 'facilities' && !coachId) {
          successCount++; // Facility only booking confirmed
        }

        // B. BOOK COACH SESSION (If coach selected)
        if (coachSessionId && coachId) {
          const coachFee = getCoachCost(coachTier, origin);

          const bookingOrigin = origin;

          const { data: coachResult, error: coachRpcError } = await supabaseAdmin.rpc('book_coach_atomic', {
            p_user_id: userId,
            p_session_id: coachSessionId,
            p_coach_id: coachId,
            p_attendee_id: targetId,
            p_credit_cost: coachFee,
            p_origin: bookingOrigin
          });

          if (coachRpcError) {
            results.push({ attendeeId: targetId, type: 'coach', success: false, error: coachRpcError.message });
          } else if (!coachResult.success) {
            results.push({ attendeeId: targetId, type: 'coach', success: false, error: coachResult.message });
          } else {
            results.push({ attendeeId: targetId, type: 'coach', success: true, message: 'Coach confirmed!' });
            successCount++;
          }
        }
      }
    }

    // Attempt to send email summary (optional, best effort)
    try {
      if (successCount > 0) {
        // Find email of user
        const { data: userProfile } = await supabaseAdmin.from('profiles').select('contact_email').eq('id', userId).single();
        if (userProfile?.contact_email) {
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
    console.error('Booking error:', err);
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 });
  }
}