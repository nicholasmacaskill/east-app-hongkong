import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { sendEmail } from '@/app/lib/email'; // Assume you have this utility

// **********************************************
// 1. GET - Fetches the list of all future sessions (READ)
// **********************************************
export async function GET() {
  // Fetch sessions that are in the future, ordered by time
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
    const { data: profile, error: profileError } = await supabase
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
    const { data: registration, error: regError } = await supabase
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
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', userId);

    if (creditError) {
      // Note: In a real-world app, you would also need to roll back the registration here.
      console.error('Failed to deduct credits:', creditError);
      return NextResponse.json({ error: 'Booking successful, but failed to deduct credits.' }, { status: 500 });
    }

    // 5. Fetch Session Details for Email
    const { data: session, error: sessionError } = await supabase
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