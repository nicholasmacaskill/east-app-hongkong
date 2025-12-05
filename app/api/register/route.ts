import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// Handler for REGISTRATION (POST)
export async function POST(request: Request) {
  const body = await request.json();
  const { userId, sessionId } = body;

  if (!userId || !sessionId) {
    return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
  }

  const { error } = await supabase
    .from('registrations')
    .insert([{ user_id: userId, session_id: sessionId }]);

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already Registered' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Handler for CANCELLATION (DELETE) - THIS MUST BE PRESENT
export async function DELETE(request: Request) {
  const body = await request.json();
  const { userId, sessionId } = body;

  if (!userId || !sessionId) {
    return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
  }

  // This deletes the booking by finding the user ID and session ID combination
  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('user_id', userId)
    .eq('session_id', sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}