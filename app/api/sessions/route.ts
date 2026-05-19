import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { sendEmail } from '@/app/lib/email'; // Assume you have this utility

// **********************************************
// 1. GET - Fetches the list of all future sessions (READ)
// **********************************************
// **********************************************
// 1. GET - Fetches the list of all future sessions (READ)
// **********************************************
export async function GET() {
  // Fetch sessions that are in the future, ordered by time
  const supabaseAdmin = getSupabaseAdmin();

  // Enforce 10-Day Booking Window
  const tenDaysLater = new Date();
  tenDaysLater.setDate(tenDaysLater.getDate() + 10);

  const { data, error } = await supabaseAdmin
    .from('sessions')
    .select(`
      *,
      registrations(count)
    `)
    .neq('status', 'cancelled') // Exclude cancelled sessions
    .gt('start_time', new Date().toISOString())
    .lte('start_time', tenDaysLater.toISOString()) // 10-Day Limit
    .order('start_time', { ascending: true });

  if (error) {
    console.error("API SESSIONS ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out sessions that are full
  // Note: registrations returns as [{ count: n }] array due to PostgREST format with count
  const availableSessions = data.filter((session: any) => {
    // If max_capacity is not set, assume unlimited
    if (!session.max_capacity) return true;

    const count = session.registrations?.[0]?.count || 0;
    return count < session.max_capacity;
  });

  return NextResponse.json(availableSessions);
}

// **********************************************
// 2. POST - Handles the booking of a session (WRITE & EMAIL)
// **********************************************
export async function POST(request: Request) {
  const { sessionId, userId } = await request.json();

  if (!sessionId || !userId) {
    return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
  }

  const COST_PER_SESSION = 100; // Define the cost

  try {
    // 1. Fetch User Profile and Credits
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits, contact_email, first_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    // 2. Credit Check
    if (profile.credits < COST_PER_SESSION) {
      return NextResponse.json({ error: 'Insufficient credits to book this session.' }, { status: 403 });
    }

    // 3. Register the User (Insert into registrations table)
    const { data: registration, error: regError } = await supabaseAdmin
      .from('registrations')
      .insert({ session_id: sessionId, user_id: userId })
      .select()
      .single();

    if (regError || !registration) {
      // Handle scenario where user is already registered, or other DB failure
      return NextResponse.json({ error: regError?.message || 'Failed to register for session.' }, { status: 500 });
    }

    // 4. Deduct Credits (Update profiles table)
    const newCredits = profile.credits - COST_PER_SESSION;
    const { error: creditError } = await supabaseAdmin
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', userId);

    if (creditError) {
      // Note: In a real-world app, you would also need to roll back the registration here.
      console.error('Failed to deduct credits:', creditError);
      return NextResponse.json({ error: 'Booking successful, but failed to deduct credits.' }, { status: 500 });
    }

    // 5. Fetch Session Details for Email
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('title, start_time')
      .eq('id', sessionId)
      .single();

    if (session && profile.contact_email) {
      // 6. Send Booking Confirmation Email
      await sendEmail({
        to: profile.contact_email,
        subject: `Booking Confirmed: ${session.title}`,
        html: `
          <p>Hi ${profile.first_name || 'Member'},</p>
          <p>Your spot is successfully reserved for <strong>${session.title}</strong>.</p>
          <p><strong>Time:</strong> ${new Date(session.start_time).toLocaleString()}</p>
          <p>You now have **${newCredits}** credits remaining.</p>
          <br/>
          <p><strong>Want to bring a friend?</strong></p>
          <p>Please message us on WhatsApp to register them: <a href="https://wa.link/b2y0sa">https://wa.link/b2y0sa</a></p>
          <p><em>(Credits will be deducted from your account upon approval)</em></p>
          <br/>
          <p>See you there!</p>
        `
      });
      console.log(`Booking Confirmation Email sent to: ${profile.contact_email}`);
    }

    // Final Success Response
    return NextResponse.json({ success: true, message: 'Session booked, credits deducted, and confirmation email sent.' });

  } catch (e) {
    console.error('API Error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred during booking.' }, { status: 500 });
  }
}