import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { parseTournamentTable } from '@/app/lib/tournamentParser';

export async function POST(request: Request) {
  try {
    const { rawText, teamFilter } = await request.json();

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json({ error: 'Please provide tournament table text to parse' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch all athlete profiles to match against
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, username, avatar_url, team')
      .eq('role', 'player');

    if (profileError) {
      console.error('Error fetching player profiles:', profileError);
      return NextResponse.json({ error: 'Failed to load player directory' }, { status: 500 });
    }

    const parsedRows = parseTournamentTable(rawText, profiles || [], teamFilter);
    const matchedCount = parsedRows.filter((r) => r.matched_profile !== null).length;

    return NextResponse.json({
      success: true,
      parsedRows,
      totalRows: parsedRows.length,
      matchedCount,
      allProfiles: profiles || []
    });
  } catch (error: any) {
    console.error('Tournament parse error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse tournament stats' }, { status: 500 });
  }
}
