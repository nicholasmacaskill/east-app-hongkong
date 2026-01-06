import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { sendEmail, BASE_URL } from '@/app/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, firstName, lastName, mobile, bio } = body;

        // Basic Validation
        if (!email || !firstName || !lastName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Use shared admin client
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Create Auth User with random password (they will reset it)
        const tempPassword = Math.random().toString(36).slice(-12) + "A1!";

        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                role: 'coach',
                first_name: firstName,
                last_name: lastName
            }
        });

        if (userError) {
            console.error('Error creating auth user:', userError);
            return NextResponse.json({ success: false, error: userError.message }, { status: 400 });
        }

        const userId = userData.user.id;
        const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

        // 2. Create Public Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                role: 'coach',
                contact_email: email,
                first_name: firstName,
                last_name: lastName,
                username: username,
                mobile: mobile || '',
                bio: bio || '',
                avatar_url: ''
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            return NextResponse.json({ success: false, error: 'User created but profile failed: ' + profileError.message }, { status: 500 });
        }

        // 3. Generate Password Reset Link
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${BASE_URL}/update-password`
            }
        });

        if (linkError) {
            console.error('Error generating reset link:', linkError);
            // Non-fatal, return success but warn
        } else if (linkData && linkData.properties?.action_link) {
            // 4. Send Email
            const actionLink = linkData.properties.action_link;

            const emailHtml = `
                <div style="font-family: Arial, sans-serif; color: #000;">
                    <h1>Welcome to EAST, Coach ${firstName}!</h1>
                    <p>Your coach account has been created.</p>
                    <p>Please click the button below to set your password and access your portal:</p>
                    <a href="${actionLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; margin-top: 10px;">Set Password & Login</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">If the button doesn't work, copy this link:<br/>${actionLink}</p>
                </div>
            `;

            await sendEmail({
                to: email,
                subject: 'Welcome to EAST - Set Your Password',
                html: emailHtml
            });
        }

        return NextResponse.json({ success: true, userId: userId });

    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
