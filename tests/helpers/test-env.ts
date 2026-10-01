import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

export type TestEnvironmentMode = 'local' | 'test' | 'production';

let cachedAdminClient: SupabaseClient | null = null;
let cachedAnonClient: SupabaseClient | null = null;
let resolvedEnvFile: string | null = null;

/**
 * Resolves the active testing target and environment mode.
 */
export function getTestMode(): { mode: TestEnvironmentMode; baseURL: string; envFile: string } {
    const isProd = process.env.PLAYWRIGHT_ENV === 'production';
    const explicitBaseURL = process.env.PLAYWRIGHT_TEST_BASE_URL;

    let baseURL = explicitBaseURL || (isProd ? 'https://app.eastsportsgroup.com' : 'http://localhost:3000');
    let mode: TestEnvironmentMode = 'local';
    let envFile = '.env.local';

    if (isProd || baseURL.includes('app.eastsportsgroup.com')) {
        mode = 'production';
        envFile = '.env.production.latest';
    } else if (baseURL.includes('test-branch-east.vercel.app') || process.env.PLAYWRIGHT_ENV === 'test') {
        mode = 'test';
        envFile = '.env.test';
    } else {
        mode = 'local';
        envFile = '.env.local';
    }

    return { mode, baseURL, envFile };
}

/**
 * Loads the appropriate environment file once and ensures consistency.
 */
export function initTestEnvironment(): { mode: TestEnvironmentMode; baseURL: string } {
    const { mode, baseURL, envFile } = getTestMode();

    if (!resolvedEnvFile) {
        resolvedEnvFile = envFile;
        dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });
    }

    return { mode, baseURL };
}

/**
 * Returns a Supabase Admin (Service Role) client configured for the active test environment.
 */
export function getTestSupabaseAdmin(): SupabaseClient {
    if (cachedAdminClient) return cachedAdminClient;

    initTestEnvironment();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            `[TestEnv] Missing Supabase Admin credentials in ${resolvedEnvFile || 'env'}. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`
        );
    }

    cachedAdminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    return cachedAdminClient;
}

/**
 * Returns a Supabase Anonymous client configured for the active test environment.
 */
export function getTestSupabaseAnon(): SupabaseClient {
    if (cachedAnonClient) return cachedAnonClient;

    initTestEnvironment();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
        throw new Error(
            `[TestEnv] Missing Supabase Anon credentials in ${resolvedEnvFile || 'env'}. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.`
        );
    }

    cachedAnonClient = createClient(supabaseUrl, anonKey);
    return cachedAnonClient;
}
