
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
                if (key && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.error("Failed to load .env.local", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPreferences() {
    console.log('Checking profiles table structure...');

    // Try to select the preferences column
    const { data, error } = await supabase
        .from('profiles')
        .select('id, preferences')
        .limit(1);

    if (error) {
        console.error('Error selecting preferences:', error.message);
        if (error.message.includes('column "preferences" does not exist')) {
            console.log('CONCLUSION: Column "preferences" MISSING');
        } else {
            console.log('CONCLUSION: Unknown error');
        }
    } else {
        console.log('Data fetched successfully:', data);
        console.log('CONCLUSION: Column "preferences" EXISTS');
    }
}

checkPreferences();
