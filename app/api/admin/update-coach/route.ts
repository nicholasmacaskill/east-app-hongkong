// app/api/admin/update-coach/route.ts
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
    mobile?: string;
    bio?: string;
}

export async function POST(request: Request) {
    try {
        const { userId, firstName, lastName, email, password, mobile, bio } = await request.json() as UpdateRequest;

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

        // 2. Update Profiles Table (Name, Email, Mobile, Bio)
        const profileUpdates: any = {};
        if (firstName) profileUpdates.first_name = firstName;
        if (lastName) profileUpdates.last_name = lastName;
        if (email) profileUpdates.contact_email = email;
        if (mobile !== undefined) profileUpdates.mobile = mobile;
        if (bio !== undefined) profileUpdates.bio = bio;

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

        // 3. AUDIT LOGGING

        // Extract Admin ID
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    }
                }
            }
        );
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (user) {
            // Sanitize auth updates
            const { password: _, ...safeAuthUpdates } = authUpdates;

            await logAdminAction(user.id, 'UPDATE_COACH', 'profile', userId, {
                authUpdates: safeAuthUpdates,
                profileUpdates: profileUpdates
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Coach updated successfully'
        });

    } catch (error: any) {
        console.error('Update coach API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
