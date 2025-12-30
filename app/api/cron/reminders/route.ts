// app/api/cron/reminders/route.ts (OPTIMIZED)
import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { sendEmail } from '@/app/lib/email';

// This route checks for sessions starting in ~1 hour and emails attendees
export async function GET() {
  const now = new Date();

  // Set the upper boundary to 61 minutes from now
  const oneHourFromNow = new Date(now.getTime() + 61 * 60 * 1000);

  // 1. Find ALL relevant registrations in one efficient query:
  //    - Starts by checking the 'registrations' table (only active users are there).
  //    - Selects the linked session and user profile data.
  const { data: registrations, error: fetchError } = await supabase
    .from('registrations')
    .select(`
        session:session_id (id, title, start_time),
        user:user_id (contact_email, first_name)
    `)
    // 🛑 CRITICAL FIX: Filter by the linked 'session' start time
    .filter('session.start_time', 'gt', now.toISOString()) // Must not have started yet
    .filter('session.start_time', 'lt', oneHourFromNow.toISOString()); // Must be starting soon

  if (fetchError) {
    console.error("Supabase Fetch Error:", fetchError);
    return NextResponse.json({ error: "Database query failed." }, { status: 500 });
  }

  if (!registrations || registrations.length === 0) {
    return NextResponse.json({ message: 'No upcoming sessions found for currently registered users in this window' });
  }

  let emailsSent = 0;

  for (const reg of registrations) {
    // Safely pull data from the joined fields
    // @ts-ignore
    const session = Array.isArray(reg.session) ? reg.session[0] : reg.session;
    // @ts-ignore
    const userRaw = reg.user;
    const userProfile = Array.isArray(userRaw) ? userRaw[0] : userRaw;

    if (session && userProfile?.contact_email) {

      console.log(`Preparing to send reminder for session ${session.id} to ${userProfile.contact_email}`);

      await sendEmail({
        to: userProfile.contact_email,
        subject: `Reminder: ${session.title} starts soon!`,
        html: `
          <p>Hi ${userProfile.first_name || 'Member'},</p>
          <p>Get ready! <strong>${session.title}</strong> is starting soon.</p>
          <p>Time: ${new Date(session.start_time).toLocaleTimeString()}</p>
          <p>See you there!</p>
        `
      });
      emailsSent++;
    }
  }

  return NextResponse.json({
    success: true,
    sessionsFound: registrations.length,
    emailsSent
  });
}