// app/api/auth/send-welcome-email/route.ts
import { NextResponse } from 'next/server';
import { sendEmail, BASE_URL } from '@/app/lib/email';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Get user profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('first_name, contact_email')
            .eq('id', userId)
            .single();

        if (profileError || !profile || !profile.contact_email) {
            return NextResponse.json({ error: 'User profile not found or missing email' }, { status: 404 });
        }

        // Send welcome email
        await sendEmail({
            to: profile.contact_email,
            subject: 'Welcome to EAST Training Hong Kong! 🏀',
            html: `
                <h1>Welcome to EAST, ${profile.first_name || 'Member'}!</h1>
                <p>Thank you for registering. Your account has been successfully created.</p>
                
                <h2>Getting Started</h2>
                <p>You can now log in to your account using the password you set during registration.</p>
                
                <p><strong>Login here:</strong> <a href="${BASE_URL}">${BASE_URL}</a></p>
                
                <h3>Forgot your password?</h3>
                <p>No problem! You can reset it anytime here: <a href="${BASE_URL}/forgot-password">${BASE_URL}/forgot-password</a></p>
                
                <br/>
                <p>If you have any questions, feel free to reach out to our support team on WhatsApp: <a href="https://wa.link/b2y0sa">https://wa.link/b2y0sa</a></p>
                
                <p>See you on the court!</p>
                <p><strong>The EAST Team</strong></p>
            `
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Welcome email error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
