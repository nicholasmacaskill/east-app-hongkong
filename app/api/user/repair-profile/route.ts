import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Check if profile really doesn't exist
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (existingProfile) {
            return NextResponse.json({ message: 'Profile already exists' });
        }

        console.log(`🛠 Repairing profile for user: ${user.id} (${user.email})`);

        // 2. Create Profile
        const { error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: user.id,
                first_name: user.user_metadata?.first_name || 'Member',
                last_name: user.user_metadata?.last_name || 'User',
                username: user.email?.split('@')[0] || 'user',
                contact_email: user.email,
                role: user.user_metadata?.role || 'player',
                credits: 0
            });

        if (insertError) {
            console.error('Repair profile failed:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Profile repaired successfully' });

    } catch (error: any) {
        console.error('Repair API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
