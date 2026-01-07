// app/api/admin/update-player/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

interface UpdateRequest {
    userId: string;
    firstName?: string;
    lastName?: string;
    email?: string; // Changing email might require auth update + re-verification
    password?: string;
    credits?: number;
    team?: string;
    position?: string;
}

export async function POST(request: Request) {
    try {
        // 1. Validate Admin (In a real app, middleware handles this, but we double check)
        // Here we assume the route is protected by RLS/Middleware or only accessible to admins

        const { userId, firstName, lastName, email, password, credits, team, position } = await request.json() as UpdateRequest;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 2. Update Auth User (Password / Email) if provided
        if (password || email) {
            const authUpdates: any = {};
            if (password && password.trim() !== '') authUpdates.password = password;
            if (email && email.trim() !== '') authUpdates.email = email;

            if (Object.keys(authUpdates).length > 0) {
                const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates);
                if (authError) {
                    console.error('Auth update error:', authError);
                    return NextResponse.json({ error: 'Failed to update password/email: ' + authError.message }, { status: 500 });
                }
            }
        }

        // 3. Update Profiles Table (Credits, Name, Team, Position)
        const profileUpdates: any = {};
        if (firstName) profileUpdates.first_name = firstName;
        if (lastName) profileUpdates.last_name = lastName;
        // Note: 'email' in profile is contact_email, might want to sync it
        if (email) profileUpdates.contact_email = email;
        if (team !== undefined) profileUpdates.team = team;
        if (position !== undefined) profileUpdates.position = position;
        if (credits !== undefined) profileUpdates.credits = credits;

        if (Object.keys(profileUpdates).length > 0) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(profileUpdates)
                .eq('id', userId);

            if (profileError) {
                console.error('Profile update error:', profileError);
                return NextResponse.json({ error: 'Failed to update profile: ' + profileError.message }, { status: 500 });
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
