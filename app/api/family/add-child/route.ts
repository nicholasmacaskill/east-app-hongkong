import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { firstName, lastName, sport, parentId } = await request.json();

        if (!firstName || !parentId) {
            return NextResponse.json({ error: 'Missing required fields: firstName and parentId' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 0. Validate Parent Exists & Fetch Parent Details
        let { data: parentProfile, error: parentCheckErr } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', parentId)
            .single();

        if (parentCheckErr || !parentProfile) {
            console.warn(`[ADD CHILD] Parent ID ${parentId} not found in profiles. Checking Auth...`);
            const { data: authResult } = await supabaseAdmin.auth.admin.getUserById(parentId);

            if (authResult?.user) {
                console.log(`[ADD CHILD] Parent found in Auth. Healing profile...`);
                const { data: healedProfile } = await supabaseAdmin.from('profiles').upsert({
                    id: parentId,
                    first_name: authResult.user.user_metadata?.first_name || 'Parent',
                    last_name: authResult.user.user_metadata?.last_name || '',
                    username: authResult.user.email,
                    contact_email: authResult.user.email,
                    role: 'parent'
                }).select().single();
                parentProfile = healedProfile;
            } else {
                return NextResponse.json({ error: `Parent account invalid: ${parentId}` }, { status: 400 });
            }
        }

        const resolvedLastName = lastName || parentProfile?.last_name || '';
        const parentContactEmail = parentProfile?.contact_email || parentProfile?.username || '';
        const parentPhone = parentProfile?.phone || null;

        console.log(`[ADD CHILD] Request: ${firstName} ${resolvedLastName} linked to parent ${parentId} (${parentContactEmail})`);

        // 1. Create Internal Auth User to satisfy Foreign Key constraints
        const internalEmail = `child_${crypto.randomUUID()}@east.internal`;
        const tempPassword = crypto.randomUUID();

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: internalEmail,
            email_confirm: true,
            user_metadata: { first_name: firstName, last_name: resolvedLastName, role: 'player' },
            password: tempPassword
        });

        if (authError || !authData?.user) {
            console.error('[ADD CHILD] Auth Error:', authError);
            return NextResponse.json({ error: authError?.message || 'Failed to create child account' }, { status: 500 });
        }

        const childId = authData.user.id;
        const sanitizedFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const generatedUsername = `${sanitizedFirst}_${Math.floor(1000 + Math.random() * 9000)}`;

        // 2. Create Profile with Parent's Contact Email
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: childId,
                first_name: firstName,
                last_name: resolvedLastName,
                username: generatedUsername,
                contact_email: parentContactEmail,
                parent_id: parentId,
                role: 'player',
                bio: sport ? `${sport} Athlete` : 'Athlete',
                credits: 0
            });

        if (profileError) {
            console.error('[ADD CHILD] Profile Error:', profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // 3. Create Player Relationship
        const { error: relError } = await supabaseAdmin.from('player_relationships').upsert({
            parent_id: parentId,
            child_id: childId,
            relationship_type: 'parent_child'
        }, { onConflict: 'parent_id, child_id' });

        if (relError) {
            console.error('[ADD CHILD] Relationship Error:', relError);
        }

        console.log(`[ADD CHILD] Successfully registered child ${childId} under parent ${parentId}`);
        return NextResponse.json({ 
            success: true, 
            childId,
            child: {
                id: childId,
                first_name: firstName,
                last_name: resolvedLastName,
                contact_email: parentContactEmail,
                phone: parentPhone,
                bio: sport ? `${sport} Athlete` : 'Athlete',
                credits: 0
            }
        });

    } catch (err: any) {
        console.error('[ADD CHILD] SERVER ERROR:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
