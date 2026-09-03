import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const { childId, parentId, email, password } = await request.json();

        if (!childId || !parentId || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields: childId, parentId, email, and password' }, { status: 400 });
        }

        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Verify Parent Ownership of Child
        const { data: childProfile, error: childErr } = await supabaseAdmin
            .from('profiles')
            .select('id, parent_id, first_name, last_name')
            .eq('id', childId)
            .single();

        if (childErr || !childProfile) {
            return NextResponse.json({ error: 'Child profile not found' }, { status: 404 });
        }

        if (childProfile.parent_id !== parentId) {
            return NextResponse.json({ error: 'Unauthorized: You can only convert your own child profiles' }, { status: 403 });
        }

        // 2. Update Child's Auth User Account (Assign Login Email & Password)
        const { data: updatedAuth, error: authUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(childId, {
            email: trimmedEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
                first_name: childProfile.first_name,
                last_name: childProfile.last_name,
                role: 'player'
            }
        });

        if (authUpdateErr) {
            console.error('[CONVERT CHILD] Auth Update Error:', authUpdateErr);
            if (authUpdateErr.message?.includes('already registered') || authUpdateErr.message?.includes('exists')) {
                return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: authUpdateErr.message }, { status: 500 });
        }

        // 3. Update Child's Profile Contact Email and Username
        const { error: profileUpdateErr } = await supabaseAdmin
            .from('profiles')
            .update({
                contact_email: trimmedEmail,
                username: trimmedEmail
            })
            .eq('id', childId);

        if (profileUpdateErr) {
            console.error('[CONVERT CHILD] Profile Update Error:', profileUpdateErr);
            return NextResponse.json({ error: profileUpdateErr.message }, { status: 500 });
        }

        console.log(`[CONVERT CHILD] Successfully converted child ${childId} to standalone athlete with email ${trimmedEmail}`);

        return NextResponse.json({
            success: true,
            message: `${childProfile.first_name} is now converted to a full athlete account! They can log in using ${trimmedEmail}.`
        });

    } catch (err: any) {
        console.error('[CONVERT CHILD] SERVER ERROR:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
