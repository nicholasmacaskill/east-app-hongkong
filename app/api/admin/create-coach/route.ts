import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { sendEmail, BASE_URL } from '@/app/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, firstName, lastName, mobile, bio, password } = body;

        // Basic Validation
        if (!email || !firstName || !lastName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Use shared admin client
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Create Auth User directly (Auto-confirm)
        // If password is provided, use it. If not, generate a random one.
        const finalPassword = password || (Math.random().toString(36).slice(-12) + "A1!");

        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: finalPassword,
            email_confirm: true,
            user_metadata: {
                role: 'coach',
                first_name: firstName,
                last_name: lastName
            }
        });

        if (userError) {
            console.error('Error creating auth user:', userError);
            return NextResponse.json({ success: false, error: userError.message }, { status: 400 });
        }

        const userId = userData.user.id;
        const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

        // 2. Upsert Public Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                role: 'coach',
                contact_email: email,
                first_name: firstName,
                last_name: lastName,
                username: username,
                mobile: mobile || '',
                bio: bio || '',
                avatar_url: '' // Default empty, can add placeholder if needed
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            return NextResponse.json({ success: false, error: 'User created but profile failed: ' + profileError.message }, { status: 500 });
        }

        // 3. Initialize Coach Services (Optional - explicitly empty for now)
        // This prevents "no rows" errors later if logic expects at least an empty set

        return NextResponse.json({ success: true, userId: userId });

    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
