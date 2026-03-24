
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { sendEmail, BASE_URL } from '@/app/lib/email';

export async function POST(request: Request) {
    try {
        const { email, password, fullName, phone, role } = await request.json();

        if (!email || !password || !fullName || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Security: Prevent self-registration as coach or admin
        if (['coach', 'admin', 'sys-admin'].includes(role)) {
            return NextResponse.json({ error: 'Coaches and Admins must be invited by an Administrator' }, { status: 403 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Split fullName into first and last for database trigger compatibility
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // 1. Create the user via Admin API (doesn't trigger standard emails if configured correctly)
        // Note: Creating with auto-confirm false so we can send our own link
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: false,
            user_metadata: {
                full_name: fullName,
                first_name: firstName,
                last_name: lastName,
                mobile: phone,
                role: role
            }
        });

        if (authError || !authUser.user) {
            console.error('Registration error:', authError);
            const status = authError?.message?.includes('User already registered') ? 400 : 500;
            return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status });
        }

        // 2. Explicitly update or create profile to ensure name and contact sync
        // (Triggers can sometimes have mismatches; upsert is safer)
        await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authUser.user.id,
                first_name: firstName,
                last_name: lastName,
                name: firstName,
                surname: lastName,
                contact_email: email,
                mobile: phone,
                role: role
            }, { onConflict: 'id' });

        // 3. Generate the signup/confirmation link
        // We Use 'signup' type for a new user
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email,
            password,
            options: {
                redirectTo: `${BASE_URL}/login?confirmed=true`
            }
        });

        if (linkError || !linkData.properties?.hashed_token) {
            console.error('Link generation error:', linkError);
            // Even if link fails, user is created, but they can't verify easily.
            return NextResponse.json({ error: 'User created but failed to generate verification link' }, { status: 500 });
        }

        // Construct the verification URL
        // Supabase generateLink returns the full properties including the hashed_token.
        // Actually, the 'action_link' in properties is the one we want.
        const verificationLink = linkData.properties.action_link;

        // 3. Send the branded email via Resend
        const emailResult = await sendEmail({
            to: email,
            subject: 'Verify Your Email Address for EAST App',
            html: `
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Hi ${fullName},</p>
                
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    Thank you for registering for the EAST App, and congratulations on joining our community! 
                    Please verify your email address by clicking the link below:
                </p>
                
                <div style="text-align: center; margin-bottom: 40px;">
                    <a href="${verificationLink}" style="background-color: #28d160; color: #000000; padding: 18px 32px; border-radius: 12px; font-weight: 900; font-style: italic; text-decoration: none; display: inline-block; font-size: 18px; text-transform: uppercase;">
                        Verify My Email
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #aaaaaa; line-height: 1.6; margin-bottom: 20px;">
                    If the button above does not work, you can copy and paste the following URL into your browser:
                </p>
                
                <p style="font-size: 12px; color: #28d160; word-break: break-all; margin-bottom: 40px;">
                    ${verificationLink}
                </p>
                
                <p style="font-size: 14px; color: #aaaaaa; line-height: 1.6;">
                    This helps us ensure that your account is secure and allows you to fully access all features of the app.
                </p>
            `,
            source: 'registration'
        });

        if (!emailResult?.success) {
            console.error('Email delivery error:', emailResult?.error);
            // We tell them they're registered but email might be delayed
            return NextResponse.json({
                success: true,
                warning: 'User created but verification email failed to send. Please contact support.'
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Registration server error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
