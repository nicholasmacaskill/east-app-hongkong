import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '12'; // Default to 12 for testing

  // 1. Get Children IDs (Family View)
  // Check BOTH player_relationships table AND profiles.parent_id column for max compatibility
  const familyIds = [userId];

  // A. Check Profiles Table (Legacy/Direct Link)
  const supabaseAdmin = getSupabaseAdmin();
  const { data: profileChildren } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('parent_id', userId);

  if (profileChildren) {
    profileChildren.forEach((row: { id: string }) => {
      if (!familyIds.includes(row.id)) familyIds.push(row.id);
    });
  }

  const { data, error } = await supabaseAdmin
    .from('registrations')
    .select(`
      session_id,
      user_id,
      status,
      sessions (
        id, title, start_time, end_time, instructor, category, description, credit_cost, image_url, status
      ),
      profiles!registrations_user_id_fkey (
        id, first_name, last_name, role
      )
    `)
    .in('user_id', familyIds) // Fetch for whole family
    .neq('status', 'cancelled');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten and Add "Who is this for?" metadata
  const schedule = (data || []).map((reg: any) => {
    if (!reg.sessions) return null;
    // CRITICAL: Double-check both registration status AND session status
    if (reg.status === 'cancelled' || reg.sessions.status === 'cancelled') return null;

    const profiles = reg.profiles;
    const attendee = Array.isArray(profiles) ? profiles[0] : profiles;
    return {
      ...reg.sessions,
      attendee: attendee // Attach attendee info safely
    };
  }).filter((s: { id: number } | null) => s && s.id);

  // Sort by date (earliest first)
  schedule.sort((a: { start_time: string }, b: { start_time: string }) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return NextResponse.json(schedule);
}