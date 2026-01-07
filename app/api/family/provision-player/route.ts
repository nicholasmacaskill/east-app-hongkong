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

        // 5. Send password reset email
        const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email
        });

        if (!resetError) {
            try {
                await sendEmail({
                    to: email,
                    subject: 'Welcome to EAST - Set Your Password',
                    html: `
            <h1>Welcome to EAST!</h1>
            <p>Your parent has created an account for you.</p>
            <p><strong>Email:</strong> ${email}</p>
            <p>Please check your email for a password reset link to set your own password.</p>
            ${initialCredits > 0 ? `<p>You've been credited with <strong>${initialCredits} credits</strong> to get started!</p>` : ''}
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
