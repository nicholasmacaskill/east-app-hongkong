import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';

async function cleanupUser(email: string) {
    const supabase = getSupabaseAdmin();

    console.log(`Searching for user: ${email}...`);
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const targetUser = users.find(u => u.email === email);

    if (targetUser) {
        console.log(`Found user ID: ${targetUser.id}. Deleting...`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUser.id);

        if (deleteError) {
            console.error('Error deleting user:', deleteError);
        } else {
            console.log('✅ User deleted successfully.');
        }
    } else {
        console.log('User not found in Supabase.');
    }
}

const email = process.argv[2] || 'bmacaskill27@gmail.com';
cleanupUser(email).catch(console.error);
