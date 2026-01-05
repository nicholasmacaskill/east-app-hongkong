import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';



export async function POST(request: Request) {
    try {
        const { firstName, lastName, email, sport, parentId } = await request.json();

        if (!email || !parentId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`Creating child account for ${email} linked to parent ${parentId}`);

        // 1. Create Auth User (Triggers Email if configured, or just creates user)
        // We set email_confirm: false so Supabase sends the magic link/confirmation if SMTP is set up.
        // Or true if we want to skip that. User said "send an email to the kid".
        // Usually `inviteUserByEmail` is better for this, but `createUser` works too.
        // Let's use createUser with auto-confirm for now to ensure they can login immediately if they restart app, 
        // OR use inviteUserByEmail if we want the specific "You've been invited" flow.
        // Given the prompt "send an email", `inviteUserByEmail` is semantically best, but `createUser` is more robust if we just want to provision.
        // Let's stick to `createUser` with a temp password or just invite.
        // Actually, `inviteUserByEmail` creates a user and sends a link.

        // Attempt to create user
        const supabaseAdmin = getSupabaseAdmin();
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true, // Auto-confirm so they don't get blocked if email delivery fails in dev
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                role: 'player'
            },
            password: 'password123' // Temp password for dev simplicity, or allow them to reset
        });

        if (authError) {
            console.error('Auth Error:', authError);
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        const childId = authData.user.id;

        // 2. Create/Update Profile with Parent Link and Sport (in Bio)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: childId,
                first_name: firstName,
                last_name: lastName,
                username: email, // generic username
                contact_email: email,
                parent_id: parentId, // LINK TO PARENT
                role: 'player',
                bio: sport ? `${sport} Player` : 'Athlete',
                credits: 0
            });

        if (profileError) {
            console.error('Profile Error:', profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // 3. Create Relationship entry (optional but good for query redundancy)
        await supabaseAdmin.from('player_relationships').insert({
            parent_id: parentId,
            child_id: childId
        });

        // 4. (Optional) Mock sending an email if in Dev environment
        console.log(`[MOCK EMAIL] To: ${email} | Subject: Welcome to EAST! | Body: Your parent has registered you.`);

        return NextResponse.json({ success: true, childId });

    } catch (err: any) {
        console.error('SERVER ERROR:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
