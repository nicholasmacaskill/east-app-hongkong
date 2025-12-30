
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: Request) {
    const apiKey = process.env.RESEND_API_KEY;
    const hasKey = !!apiKey;

    console.log("--- DEBUG EMAIL START ---");
    console.log(`Has RESEND_API_KEY: ${hasKey}`);

    if (!hasKey) {
        return NextResponse.json({ error: 'Missing RESEND_API_KEY' }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    try {
        // 1. Send test email
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'delivered@resend.dev', // This is a specific test address provided by Resend
            subject: 'Debug Email Test',
            html: '<p>If you see this, email sending works!</p>'
        });

        console.log("Resend sending attempt result:", { data, error });

        // 2. Check a user profile to see if they have an email
        // taking a likely user ID from run_sql.ts or just listing first 1
        const { data: profiles, error: dbError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        return NextResponse.json({
            emailResult: { data, error },
            profilesSample: profiles,
            dbError
        });

    } catch (e) {
        console.error("Unexpected error in debug route:", e);
        return NextResponse.json({ error: (e as any).message }, { status: 500 });
    }
}
