import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';



export async function POST(request: Request) {
    try {
        const { firstName, lastName, email, sport, parentId } = await request.json();

        if (!email || !parentId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`[ADD CHILD] Request: ${firstName} ${lastName} (${email}) linked to ${parentId}`);
        const supabaseAdmin = getSupabaseAdmin();

        // 0. Validate Parent Exists
        let { data: parentExists, error: parentCheckErr } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', parentId)
            .single();

        if (parentCheckErr || !parentExists) {
            console.warn(`[ADD CHILD] Parent ID ${parentId} not found in profiles. Checking Auth...`);
            const { data: authResult } = await supabaseAdmin.auth.admin.getUserById(parentId);

            if (authResult?.user) {
                console.log(`[ADD CHILD] Parent found in Auth. Healing profile...`);
                await supabaseAdmin.from('profiles').upsert({
                    id: parentId,
                    first_name: authResult.user.user_metadata?.first_name || 'Parent',
                    last_name: authResult.user.user_metadata?.last_name || '',
                    username: authResult.user.email,
                    contact_email: authResult.user.email,
                    role: 'parent'
                });
            } else {
                return NextResponse.json({ error: `Parent account invalid: ${parentId}` }, { status: 400 });
            }
        }

        // 1. Create OR Fetch Auth User
        let childId: string;

        // Attempt to create
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: { first_name: firstName, last_name: lastName, role: 'player' },
            password: 'password123'
        });

        if (authError) {
            // Check if user already exists
            if (authError.message?.includes('registered') || authError.message?.includes('exists')) {
                console.log(`[ADD CHILD] User ${email} already exists. Linking existing account.`);
                // Fetch existing user
                // query by email is not directly exposed on admin client easily without listUsers
                // But we can try getAllUser or listUsers. 
                // A better way is using listUsers ({ params }) with filter? No, standard API doesn't support email filter well.
                // WE will rely on creating a "Soft Fail".

                // WORKAROUND: We can't easily get ID by email via Admin API without iterating.
                // But we CAN Just fail gracefully if we can't find them, OR (better)
                // Use the generateLink trick or just accept we might not be able to link if we don't know the ID.

                // Actually, supabaseAdmin.rpc might have a function? No.
                // Let's iterate? No, too slow.
                // Wait, logic check: if they exist, is it "OUR" child?
                // If the user manually added them before?

                // BETTER APPROACH FOR NOW: Return 409 Conflict so the UI tells the user.
                return NextResponse.json({ error: 'User with this email already exists. Please contact support to link them.' }, { status: 409 });
            }

            console.error('[ADD CHILD] Auth Error:', authError);
            return NextResponse.json({ error: authError.message }, { status: 500 });
        } else {
            childId = authData.user.id;
        }

        // 2. Create/Update Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: childId,
                first_name: firstName,
                last_name: lastName,
                username: email,
                contact_email: email,
                parent_id: parentId,
                role: 'player',
                bio: sport ? `${sport} Player` : 'Athlete',
                credits: 0
            });

        if (profileError) {
            console.error('[ADD CHILD] Profile Error:', profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // 3. Create Relationship (Upsert to prevent duplicate unique key error)
        // We use onConflict on columns (parent_id, child_id) if the constraint exists
        const { error: relError } = await supabaseAdmin.from('player_relationships').upsert({
            parent_id: parentId,
            child_id: childId,
            relationship_type: 'parent_child'
        }, { onConflict: 'parent_id, child_id' });

        if (relError) {
            console.error('[ADD CHILD] Relationship Error:', relError);
            // Non-critical if profile linked
        }

        console.log(`[ADD CHILD] Success: ${childId}`);
        return NextResponse.json({ success: true, childId });

    } catch (err: any) {
        console.error('[ADD CHILD] SERVER ERROR:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
