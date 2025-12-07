import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// Handler for REGISTRATION (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, sessionId } = body;

    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
    }

    const { error } = await supabase
      .from('registrations')
      .insert([{ user_id: userId, session_id: sessionId }]);

    if (error) {
      console.error("Supabase Register Error:", error);
      // Handle "Unique Violation" specifically
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already Registered' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message || 'Database Error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// Handler for CANCELLATION (DELETE)
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { userId, sessionId } = body;

    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
    }

    // Use .select() to confirm deletion happened
    const { data, error } = await supabase
      .from('registrations')
      .delete()
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .select();

    if (error) {
      console.error("Supabase Delete Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}