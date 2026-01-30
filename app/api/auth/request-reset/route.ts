import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { sendEmail } from '@/app/lib/email';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        console.log(`[RESET API] Requesting link for ${email}`);

        // 1. Generate Link (OTP) via Supabase Admin
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email,
        });

        if (error) {
            console.error('[RESET API] Supabase Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const otp = data.properties?.email_otp;
        const link = data.properties?.action_link;

        if (!otp) {
            console.error('[RESET API] No OTP returned.', data);
            return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
        }

        console.log(`[RESET API] Generated OTP: ${otp}`);

        // 2. Send via Resend
        await sendEmail({
            to: email,
            subject: 'Your Password Reset Code',
            html: `
                <div style="font-family: sans-serif; text-align: center; color: #ffffff;">
                    <h1>Reset Your Password</h1>
                    <p>Use the code below to verify your identity:</p>
                    <div style="background: #1a1a1a; color: #ffffff; padding: 20px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border: 1px solid #333; border-radius: 8px;">
                        ${otp}
                    </div>
                    <p style="color: #aaaaaa; font-size: 14px;">If you didn't request this, you can ignore this email.</p>
                </div>
            `
        });

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error('[RESET API] Unexpected Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
