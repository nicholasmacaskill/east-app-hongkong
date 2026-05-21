/**
 * GET /api/google-calendar
 *
 * Fetches the authenticated user's upcoming Google Calendar events.
 * Uses stored refresh token (server-side only) to call Google Calendar API.
 * Returns events formatted as CalendarEvent[] matching the East App schema.
 *
 * Security: supabaseAdmin reads token — never exposed to client.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { google } from 'googleapis';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export async function GET(req: NextRequest) {
  try {
    // 1. Verify the user is authenticated
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch refresh token via supabaseAdmin (bypasses column-level restriction)
    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('google_refresh_token')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.google_refresh_token) {
      return NextResponse.json({ connected: false, events: [] });
    }

    // Set up OAuth client with stored refresh token
    oauth2Client.setCredentials({
      refresh_token: profile.google_refresh_token,
    });

    // 4. Fetch upcoming events (next 60 days)
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const now = new Date();
    const sixtyDaysLater = new Date();
    sixtyDaysLater.setDate(now.getDate() + 60);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: sixtyDaysLater.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const googleEvents = response.data.items ?? [];

    // 5. Format as CalendarEvent[] matching East App's existing type
    const events = googleEvents
      .filter((e) => e.start?.dateTime || e.start?.date) // skip events with no time
      .map((e) => {
        const startRaw = e.start?.dateTime ?? `${e.start?.date}T00:00:00`;
        const endRaw = e.end?.dateTime ?? `${e.end?.date}T23:59:00`;
        return {
          id: `gcal_${e.id}`,
          title: e.summary ?? '(No title)',
          startTime: new Date(startRaw).toISOString(),
          endTime: new Date(endRaw).toISOString(),
          type: 'google' as const,
          host: e.organizer?.displayName ?? e.organizer?.email ?? undefined,
          location: e.location ?? undefined,
          htmlLink: e.htmlLink ?? undefined,
        };
      });

    return NextResponse.json({ connected: true, events });
  } catch (err: any) {
    // Handle revoked token gracefully
    if (err?.response?.status === 401 || err?.code === 401) {
      return NextResponse.json({ connected: false, events: [], tokenRevoked: true });
    }
    console.error('[google-calendar] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }
}
