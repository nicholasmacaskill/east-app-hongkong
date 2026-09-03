import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { scanAndPurgeTestAccounts } from './helpers/db-cleanup';

const isProd = process.env.PLAYWRIGHT_ENV === 'production';
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || (isProd ? 'https://app.eastsportsgroup.com' : 'https://test-branch-east.vercel.app');

let envFile = '.env.test';
if (isProd || baseURL.includes('app.eastsportsgroup.com')) {
    envFile = '.env.production.latest';
} else if (baseURL.includes('localhost') || baseURL.includes('127.0.0.1')) {
    envFile = '.env.local';
}

dotenv.config({ path: path.resolve(__dirname, '../', envFile), override: true });

async function globalSetup() {
    console.log('🚀 [GLOBAL SETUP] Starting pre-flight test environment verification...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('⚠️ [GLOBAL SETUP] Supabase credentials not found in env, skipping cleanup.');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    await scanAndPurgeTestAccounts(supabase);
}

export default globalSetup;
