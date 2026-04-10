import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { sendEmail, BASE_URL } from '@/app/lib/email';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const baseUrl = BASE_URL;

        // 1. Generate Recovery Link via Supabase Admin
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${baseUrl}/auth/update-password`
            }
        });

        if (linkError || !linkData.properties?.action_link) {
            console.error('Error generating link:', linkError);
            return NextResponse.json({ error: 'Failed to generate reset link: ' + (linkError?.message || 'Unknown') }, { status: 500 });
        }

        let resetLink = linkData.properties.action_link;
        if (resetLink.includes('dynevents.com') || resetLink.includes('dynamic-events')) {
            resetLink = resetLink.replace(/https:\/\/[^/]+\.(dynevents\.com|dynamic-events\.com)/, 'https://app.eastsportsgroup.com');
        }

        // 2. Send Email via Resend
        const emailResult = await sendEmail({
            to: email,
            subject: 'Reset Your EAST Password',
            html: `
                <div style="font-family: sans-serif; color: #ffffff;">
                    <h1>Password Reset Request</h1>
                    <p>You requested a password reset for your EAST account.</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetLink}" style="display: inline-block; background-color: #28D160; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 16px 0;">Reset Password</a>
                    <p>Or copy and paste this link:</p>
                    <p><a href="${resetLink}" style="color: #28D160;">${resetLink}</a></p>
                    <p style="color: #aaaaaa; font-size: 14px;">If you did not request this, please ignore this email.</p>
                </div>
            `
        });

        if (!emailResult || !emailResult.success) {
            const errorMsg = emailResult?.error ? (typeof emailResult.error === 'object' ? JSON.stringify(emailResult.error) : emailResult.error) : 'Unknown error';
            console.error('Email sending failed:', errorMsg);
            return NextResponse.json({ error: 'Failed to send email via Resend: ' + errorMsg }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Password reset email sent via Resend'
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
