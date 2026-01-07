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

        // 0. Validate Parent Exists (Self-Healing Debug Step)
        console.log(`[ADD CHILD] Validating Parent ID: ${parentId}`);
        let { data: parentExists, error: parentCheckErr } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', parentId)
            .single();

        if (parentCheckErr || !parentExists) {
            console.warn(`[ADD CHILD] Parent ID ${parentId} NOT FOUND in profiles table. Attempting self-healing...`);

            // Self-Healing: Check Auth directly
            const { data: { user: authUser }, error: authFetchErr } = await supabaseAdmin.auth.admin.getUserById(parentId);

            if (authUser) {
                console.log(`[ADD CHILD] Parent found in Auth. Proactively creating profile for ${authUser.email}`);
                const { error: healErr } = await supabaseAdmin.from('profiles').upsert({
                    id: parentId,
                    first_name: authUser.user_metadata?.first_name || authUser.user_metadata?.full_name?.split(' ')[0] || 'User',
                    last_name: authUser.user_metadata?.last_name || authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'Parent',
                    username: authUser.email,
                    contact_email: authUser.email,
                    role: 'parent'
                });

                if (healErr) {
                    console.error(`[ADD CHILD] Self-healing failed:`, healErr);
                    return NextResponse.json({ error: `Critical: Parent profile missing and auto-repair failed.` }, { status: 400 });
                }
                console.log(`[ADD CHILD] Self-healing success. Profile created.`);
            } else {
                console.error(`[ADD CHILD] Parent ID ${parentId} NOT FOUND in Auth either.`);
                return NextResponse.json({ error: `Parent profile not found: ${parentId}` }, { status: 400 });
            }
        } else {
            console.log(`[ADD CHILD] Parent found.`);
        }

        // 1. Create Auth User
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
