import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, sessionId } = body;

  // Validate input
  if (!userId || !sessionId) {
    return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
  }

  // Insert the booking into Supabase
  const { error } = await supabase
    .from('registrations')
    .insert([{ user_id: userId, session_id: sessionId }]);

  if (error) {
    // Handle "Already Registered" error (Unique Constraint)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already Registered' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}