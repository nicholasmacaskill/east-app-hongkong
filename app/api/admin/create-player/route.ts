import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { logAdminAction } from '@/app/lib/audit';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, firstName, lastName, team, position, role = 'player', parentId, password } = body;

        // Basic Validation
        if (!email || !firstName || !lastName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        let userId: string;

        // ENFORCED: Immediate Login (No Email Confirmation)
        // If password is provided, use it. If not, generate a random one (admin can reset later).
        const finalPassword = password || Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);

        // 1. Create Auth User directly (Auto-confirm)
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: finalPassword,
            email_confirm: true,
            user_metadata: {
                role: role,
                first_name: firstName,
                last_name: lastName
            }
        });

        if (userError) {
            console.error('Error creating auth user:', userError);
            return NextResponse.json({ success: false, error: userError.message }, { status: 400 });
        }
        userId = userData.user.id;
        const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

        // 2. Upsert Public Profile
        const profileData: any = {
            id: userId,
            role: role,
            contact_email: email,
            first_name: firstName,
            last_name: lastName,
            username: username,
            credits: 0
        };

        if (role === 'player') {
            profileData.team = team || '';
            profileData.position = position || '';
            if (parentId) profileData.parent_id = parentId;
        }

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert(profileData);

        if (profileError) {
            console.error('Profile error:', profileError);
            return NextResponse.json({ success: false, error: 'Invite sent but profile failed: ' + profileError.message }, { status: 500 });
        }

        // 3. Sync player_relationships if linking to parent
        if (role === 'player' && parentId) {
            await supabaseAdmin.from('player_relationships').upsert({
                child_id: userId,
                parent_id: parentId
            });
        }

        // AUDIT LOGGING
        const { data: { user: adminUser } } = await supabaseAdmin.auth.getUser(request.headers.get('Authorization')?.replace('Bearer ', '') || '');

        let adminId = userId; // Fallback if admin info not found
        let adminName = 'System';

        if (adminUser) {
            adminId = adminUser.id;
            const { data: adminProfile } = await supabaseAdmin
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', adminId)
                .single();
            if (adminProfile) adminName = `${adminProfile.first_name} ${adminProfile.last_name}`;
        }

        const targetName = `${firstName} ${lastName}`;

        await logAdminAction(
            adminId,
            'CREATE_PLAYER',
            'profile',
            userId,
            { email, role, team, position, parentId },
            adminName,
            targetName
        );

        return NextResponse.json({ success: true, userId: userId });

    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
