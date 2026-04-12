// app/api/admin/update-player/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { logAdminAction } from '@/app/lib/audit';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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
    avatarUrl?: string;
    creditNote?: string;
}

export async function POST(request: Request) {
    try {
        const {
            userId, firstName, lastName, email, password, credits,
            team, position, role, parentId, mobile, bio,
            membershipStart, membershipExpires, accountStatus, avatarUrl,
            creditNote
        } = await request.json() as UpdateRequest;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // AUTHENTICATION & ROLE CHECK
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                        } catch (error) { }
                    }
                }
            }
        );
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        const { data: adminProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'sys-admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

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
        if (avatarUrl !== undefined) profileUpdates.avatar_url = avatarUrl;

        if (Object.keys(profileUpdates).length > 0) {
            // DETECT CREDIT CHANGE FOR TRANSACTION LOGGING
            let creditDelta = 0;
            let initialCredits = 0;
            if (credits !== undefined) {
                const { data: oldProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('credits')
                    .eq('id', userId)
                    .single();
                initialCredits = oldProfile?.credits || 0;
                creditDelta = credits - initialCredits;
            }

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(profileUpdates)
                .eq('id', userId);

            if (profileError) {
                console.error('Profile update error:', profileError);
                return NextResponse.json({ error: 'Failed to update profile: ' + profileError.message }, { status: 500 });
            }

            // LOG CREDIT TRANSACTION IF DELTA EXISTS
            if (creditDelta !== 0) {
                await supabaseAdmin.from('transactions').insert({
                    user_id: userId,
                    amount: creditDelta,
                    type: 'transfer',
                    description: creditNote || `Profile update adjustment by admin`
                });
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

        // 4. AUDIT LOGGING

        if (user) {
            // Fetch admin name
            const { data: adminProfile } = await supabaseAdmin
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', user.id)
                .single();
            const adminName = adminProfile ? `${adminProfile.first_name} ${adminProfile.last_name}` : user.email;

            // Fetch target name
            const { data: targetProfile } = await supabaseAdmin
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', userId)
                .single();
            const targetName = targetProfile ? `${targetProfile.first_name} ${targetProfile.last_name}` : 'Unknown';

            // Sanitize auth updates (remove password)
            const { password: _, ...safeAuthUpdates } = authUpdates;

            await logAdminAction(
                user.id,
                'UPDATE_PLAYER',
                'profile',
                userId,
                {
                    authUpdates: safeAuthUpdates,
                    profileUpdates: profileUpdates
                },
                adminName,
                targetName
            );
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
