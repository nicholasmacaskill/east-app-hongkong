import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Delete from profiles table (cascades to related tables via foreign keys)
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

        // 2. Delete from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error('Auth deletion error:', authError);
            // Profile is already deleted, so we log but don't fail
            console.warn(`Auth user ${userId} could not be deleted: ${authError.message}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Player deleted successfully'
        });

    } catch (error: any) {
        console.error('Delete player error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
