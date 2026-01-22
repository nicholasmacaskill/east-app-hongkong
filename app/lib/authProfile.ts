import { supabase } from './supabase';
import type { UserRole } from '../types';

/**
 * Resiliently fetches a user profile with retries to handle the gap 
 * between Auth creation and Profile table availability.
 */
export async function fetchProfileResilient(
    userId: string,
    maxRetries: number = 3,
    delayMs: number = 300
): Promise<any | null> {
    let lastError = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                lastError = error;
                // If it's a "PGRST116" (JSON object requested, but no rows returned), 
                // it means the profile doesn't exist yet. Retry.
                if (error.code === 'PGRST116') {
                    console.log(`[AUTH_PROFILE] Profile not found for ${userId}, retry ${i + 1}/${maxRetries}...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1))); // Exponential-ish backoff
                    continue;
                }
                throw error;
            }

            if (data) {
                return data;
            }
        } catch (err) {
            console.error(`[AUTH_PROFILE] Attempt ${i + 1} failed:`, err);
            await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
        }
    }

    console.error(`[AUTH_PROFILE] Permanent failure fetching profile for ${userId} after ${maxRetries} retries.`);
    return null;
}
