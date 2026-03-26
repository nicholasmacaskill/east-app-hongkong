import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteUser() {
    const userId = '5518e35e-e945-4314-b249-e78b00fded06';
    
    console.log(`Starting deletion for user ${userId}...`);

    // Delete from profiles first to avoid FK constraint issues if any
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
    if (profileError) {
        console.error('Error deleting from profiles:', profileError);
    } else {
        console.log('Successfully deleted/ensured profile is deleted.');
    }

    // Delete from auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
        console.error('Error deleting from auth.users:', authError);
    } else {
        console.log(`Successfully deleted auth user ${userId}.`);
    }

    console.log('Cleanup complete.');
}

deleteUser();
