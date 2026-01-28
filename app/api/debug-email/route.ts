
import { NextResponse } from 'next/server';
import { sendEmail } from '@/app/lib/email';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET(request: Request) {
    const apiKey = process.env.RESEND_API_KEY;
    const hasKey = !!apiKey;

    console.log("--- DEBUG EMAIL START ---");
    console.log(`Has RESEND_API_KEY: ${hasKey}`);

    if (!hasKey) {
        return NextResponse.json({ error: 'Missing RESEND_API_KEY' }, { status: 500 });
    }

    try {
        // 1. Send test email using centralized helper
        const result = await sendEmail({
            to: 'delivered@resend.dev',
            subject: 'Debug Email Test',
            html: '<p>If you see this, email sending works through the sendEmail helper!</p>',
            source: 'debug-route'
        });

        console.log("sendEmail attempt result:", result);

        // 2. Check a user profile to see if they have an email
        // taking a likely user ID from run_sql.ts or just listing first 1
        const supabaseAdmin = getSupabaseAdmin();
        const { data: profiles, error: dbError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .limit(1);

        return NextResponse.json({
            emailResult: result,
            profilesSample: profiles,
            dbError
        });

    } catch (e) {
        console.error("Unexpected error in debug route:", e);
        return NextResponse.json({ error: (e as any).message }, { status: 500 });
    }
}
