import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, firstName, lastName, mobile, bio } = body;

        // Basic Validation
        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 1. Create Auth User
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
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

        // 2. Create Public Profile
        // Note: The handle_new_user trigger might have already created a basic profile.
        // We use UPSERT to ensure we overlay correct data.
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
                avatar_url: '' // Default empty
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            // Optional: Delete the auth user if profile creation fails? 
            // For now, let's just report the error.
            return NextResponse.json({ success: false, error: 'User created but profile failed: ' + profileError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, userId: userId });

    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
