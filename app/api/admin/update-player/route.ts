// app/api/admin/update-player/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

interface UpdateRequest {
    userId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    credits?: number;
    team?: string;
    position?: string;
    role?: string;
    parentId?: string;
    mobile?: string;
    bio?: string;
    membershipStart?: string;
    membershipExpires?: string;
    accountStatus?: string;
}

export async function POST(request: Request) {
    try {
        const {
            userId, firstName, lastName, email, password, credits,
            team, position, role, parentId, mobile, bio,
            membershipStart, membershipExpires, accountStatus
        } = await request.json() as UpdateRequest;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Update Auth User (Password / Email / Metadata)
        const authUpdates: any = {};
        if (password && password.trim() !== '') authUpdates.password = password;
        if (email && email.trim() !== '') authUpdates.email = email;

        // Sync metadata for auth
        const metadata: any = {};
        if (firstName) metadata.first_name = firstName;
        if (lastName) metadata.last_name = lastName;
        if (Object.keys(metadata).length > 0) authUpdates.user_metadata = metadata;

        if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates);
            if (authError) {
                console.error('Auth update error:', authError);
                return NextResponse.json({ error: 'Failed to update user account: ' + authError.message }, { status: 500 });
            }
        }

        // 2. Update Profiles Table (Credits, Name, Team, Position)
        const profileUpdates: any = {};
        if (firstName) profileUpdates.first_name = firstName;
        if (lastName) profileUpdates.last_name = lastName;
        if (email) profileUpdates.contact_email = email;
        if (team !== undefined) profileUpdates.team = team;
        if (position !== undefined) profileUpdates.position = position;
        if (credits !== undefined) profileUpdates.credits = credits;
        if (role) profileUpdates.role = role;
        if (parentId !== undefined) profileUpdates.parent_id = parentId === '' ? null : parentId;
        if (mobile !== undefined) profileUpdates.mobile = mobile;
        if (bio !== undefined) profileUpdates.bio = bio;
        if (membershipStart !== undefined) profileUpdates.membership_start = membershipStart;
        if (membershipExpires !== undefined) profileUpdates.membership_expires = membershipExpires;
        if (accountStatus !== undefined) profileUpdates.account_status = accountStatus;

        if (Object.keys(profileUpdates).length > 0) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(profileUpdates)
                .eq('id', userId);

            if (profileError) {
                console.error('Profile update error:', profileError);
                return NextResponse.json({ error: 'Failed to update profile: ' + profileError.message }, { status: 500 });
            }

            // 3. Sync player_relationships if parentId/role changed
            if (parentId !== undefined || role === 'player') {
                // If it's a player, ensure they have a relationship record if they have a parent
                if (parentId) {
                    await supabaseAdmin.from('player_relationships').delete().eq('child_id', userId);
                    await supabaseAdmin.from('player_relationships').insert({
                        child_id: userId,
                        parent_id: parentId
                    });
                } else {
                    // If parentId is null, remove relationship
                    await supabaseAdmin.from('player_relationships').delete().eq('child_id', userId);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Player updated successfully'
        });

    } catch (error: any) {
        console.error('Update player API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
