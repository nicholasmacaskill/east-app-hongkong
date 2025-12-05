import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '12'; // Default to 12 for testing

  const { data, error } = await supabase
    .from('registrations')
    .select(`
      session_id,
      sessions (
        id, title, start_time, end_time, instructor, category, description
      )
    `)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the structure to return just the session details
  // @ts-ignore
  const schedule = data.map((reg) => reg.sessions).filter(Boolean);
  
  // Sort by date (earliest first)
  schedule.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return NextResponse.json(schedule);
}