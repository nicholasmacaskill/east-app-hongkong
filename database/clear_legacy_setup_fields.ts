import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearLegacySetupFields() {
    console.log('Clearing legacy pods/colors/duration fields from all production drills...');

    const { data, error } = await supabase
        .from('coach_drills')
        .update({ pods: null, colors: null, duration: null })
        .or('pods.not.is.null,colors.not.is.null,duration.not.is.null')
        .select('id, title');

    if (error) {
        console.error('❌ Failed to clear fields:', error.message);
        process.exit(1);
    }

    if (!data || data.length === 0) {
        console.log('✅ No drills had legacy setup fields set — nothing to clear.');
    } else {
        console.log(`✅ Cleared setup fields from ${data.length} drill(s):`);
        data.forEach(d => console.log(`   - ${d.title} (${d.id})`));
    }
}

clearLegacySetupFields();
