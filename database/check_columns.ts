import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    const { data: s } = await supabase.from('sessions').select('*').limit(1);
    console.log('sessions fields:', s ? Object.keys(s[0] || {}) : 'none');
    
    const { data: t } = await supabase.from('session_types').select('*').limit(1);
    console.log('session_types fields:', t ? Object.keys(t[0] || {}) : 'none');
}
main().catch(console.error);
