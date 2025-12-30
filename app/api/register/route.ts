// app/api/register/route.ts (MODIFIED)

import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
// REMOVE: import { Resend } from 'resend';
// REMOVE: const resend = new Resend(process.env.RESEND_API_KEY);

// IMPORT the Inngest client to send the event
import { inngest } from '@/app/inngest/client'; 

const CLASS_CAPACITY = 12;
const COST_IN_CREDITS = 1;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, sessionId } = body;

    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
    }

    // ... (Steps 1, 2, 3: Check Capacity, Check/Deduct Credits, Register User) ...

    // 1. Check Class Capacity
    // ... (Your existing code) ...

    // 2. Check & Deduct Credits (Atomic Transaction)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, contact_email, first_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 });

    if (profile.credits < COST_IN_CREDITS) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 }); 
    }

    // 3. Register the User
    const { error: registerError } = await supabase
      .from('registrations')
      .insert([{ user_id: userId, session_id: sessionId }]);

    if (registerError) {
      if (registerError.code === '23505') return NextResponse.json({ error: 'Already Registered' }, { status: 409 });
      throw registerError;
    }

    // 4. Deduct the Credit (Keep this synchronous for atomicity)
    const newCredits = profile.credits - COST_IN_CREDITS; // Calculate new credit amount
    const { error: deductError } = await supabase
      .from('profiles')
      .update({ credits: newCredits }) // Use the new credit amount
      .eq('id', userId);

    if (deductError) console.error("Failed to deduct credit after booking!", deductError);

    // 5. SEND CONFIRMATION EVENT (Instead of sending the email synchronously)
    if (profile.contact_email) {
      await inngest.send({
        name: 'app/booking.registered', // The event name your Inngest function listens for
        data: {
          userId: userId,
          sessionId: sessionId,
          contact_email: profile.contact_email,
          first_name: profile.first_name,
          remainingCredits: newCredits, // Pass the new credit amount to the function
        }
      });
      // The function in app/inngest/client.ts will now handle the email asynchronously.
    }

    return NextResponse.json({ success: true, remainingCredits: newCredits }); // Return the new credit amount

  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}