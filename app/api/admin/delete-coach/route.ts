import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { logAdminAction } from '@/app/lib/audit';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Fetch info before deletion for audit
        const { data: targetProfile } = await supabaseAdmin
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
            .single();
        const targetName = targetProfile ? `${targetProfile.first_name} ${targetProfile.last_name}` : 'Unknown';

        // 2. Delete from profiles table
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error('Profile deletion error:', profileError);
            return NextResponse.json({
                success: false,
                error: `Failed to delete profile: ${profileError.message}`
            }, { status: 500 });
        }

        // 3. Delete from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Auth deletion error:', authError);
            console.warn(`Auth user ${userId} could not be deleted: ${authError.message}`);
        }

        // 4. AUDIT LOGGING
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
        );
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (user) {
            const { data: adminProfile } = await supabaseAdmin
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', user.id)
                .single();
            const adminName = adminProfile ? `${adminProfile.first_name} ${adminProfile.last_name}` : user.email;

            await logAdminAction(user.id, 'DELETE_COACH', 'profile', userId, {}, adminName, targetName);
        }

        return NextResponse.json({
            success: true,
            message: 'Coach deleted successfully'
        });

    } catch (error: any) {
        console.error('Delete coach error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
