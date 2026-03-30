import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // 1. Authenticate the User
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 2. Check Credit Balance
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('credits, first_name, last_name')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        if (profile.credits > 0) {
            return NextResponse.json({ 
                error: 'Account Cannot Be Deleted', 
                message: `You still have ${profile.credits} credits. Please use them or contact support to proceed with deletion.` 
            }, { status: 400 });
        }

        // 3. SECURE DELETION
        console.log(`⚠️ User ${profile.first_name} ${profile.last_name} (${user.id}) is deleting their account.`);

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error('Delete User Error:', deleteError);
            return NextResponse.json({ error: 'Deletion failed: ' + deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Account successfully deleted.' });

    } catch (e: any) {
        console.error('Delete Account API Exception:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
