// app/api/family/provision-player/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { sendEmail } from '@/app/lib/email';

interface ProvisionRequest {
    parentId: string;
    email: string;
    firstName: string;
    lastName: string;
    initialCredits?: number;
}

export async function POST(request: Request) {
    try {
        const { parentId, email, firstName, lastName, initialCredits = 0 } = await request.json() as ProvisionRequest;

        if (!parentId || !email || !firstName || !lastName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Verify parent exists and has sufficient credits for transfer
        const { data: parent, error: parentError } = await supabaseAdmin
            .from('profiles')
            .select('credits, role')
            .eq('id', parentId)
            .single();

        if (parentError || !parent) {
            return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
        }

        if (parent.role !== 'parent') {
            return NextResponse.json({ error: 'User is not a parent' }, { status: 403 });
        }

        if (initialCredits > 0 && parent.credits < initialCredits) {
            return NextResponse.json({
                error: 'Insufficient credits for transfer',
                available: parent.credits,
                requested: initialCredits
            }, { status: 400 });
        }

        // 2. Create Auth User via Supabase Admin API
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'; // Random secure password

        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                role: 'player'
            }
        });

        if (authError || !authUser.user) {
            console.error('Auth creation failed:', authError);
            return NextResponse.json({
                error: 'Failed to create user account: ' + (authError?.message || 'Unknown error')
            }, { status: 500 });
        }

        // 3. Create player profile (handle_new_user trigger should do this, but we'll ensure)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authUser.user.id,
                first_name: firstName,
                last_name: lastName,
                role: 'player',
                parent_id: parentId,
                credits: 0, // Credits will be transferred separately
                contact_email: email
            }, { onConflict: 'id' });

        if (profileError) {
            console.error('Profile creation failed:', profileError);
            // Continue anyway - handle_new_user trigger may have already created it
        }

        // 4. Transfer initial credits if specified
        if (initialCredits > 0) {
            // Deduct from parent
            await supabaseAdmin
                .from('profiles')
                .update({ credits: parent.credits - initialCredits })
                .eq('id', parentId);

            // Add to child
            await supabaseAdmin
                .from('profiles')
                .update({ credits: initialCredits })
                .eq('id', authUser.user.id);
        }

        // 5. Generate and harden the password reset link
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email
        });

        if (!linkError && linkData?.properties?.action_link) {
            let resetLink = linkData.properties.action_link;
            
            // Domain Hardening
            if (resetLink.includes('dynevents.com') || resetLink.includes('dynamic-events')) {
                resetLink = resetLink.replace(/https:\/\/[^/]+\.(dynevents\.com|dynamic-events\.com)/, 'https://app.eastsportsgroup.com');
            }

            try {
                await sendEmail({
                    to: email,
                    subject: 'Welcome to EAST - Set Your Password',
                    html: `
                        <div style="font-family: sans-serif; color: #ffffff;">
                            <h1 style="color: #28D160; font-style: italic;">Welcome to EAST!</h1>
                            <p>Your account has been created by your parent.</p>
                            <p style="margin: 20px 0;"><strong>Username:</strong> ${email}</p>
                            <p>Click the button below to set your password and start training:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetLink}" style="background-color: #28D160; color: #000; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase;">Set My Password</a>
                            </div>
                            <p style="color: #666; font-size: 14px;">This link will expire soon. If it doesn't work, please request a new reset from the login screen.</p>
                        </div>
                    `
                });
            } catch (emailErr) {
                console.error('Email send failed:', emailErr);
            }
        }

        console.log(`✅ Player provisioned: ${authUser.user.id} by parent ${parentId}`);

        return NextResponse.json({
            success: true,
            playerId: authUser.user.id,
            email,
            creditsTransferred: initialCredits,
            message: 'Player account created successfully'
        });

    } catch (error: any) {
        console.error('Provision player error:', error);
        return NextResponse.json({
            error: 'Failed to provision player: ' + error.message
        }, { status: 500 });
    }
}
