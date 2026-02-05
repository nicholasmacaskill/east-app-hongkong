import { supabase } from '@/app/lib/supabase';
import { MOCK_SESSIONS } from '@/app/mocking/sessions';
import { Session } from '@/app/types/index';

// IMPORTANT: This flag must be read from NEXT_PUBLIC_... for client-side components to work.
const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// --- Real Data Fetcher (Calls API for secure filtering) ---
async function fetchSessionsReal(): Promise<Session[]> {
    try {
        // We use the Next.js API route because it handles:
        // 1. Admin-level privileges to count registrations (for hiding full slots)
        // 2. Consistent 7-day window enforcement
        // 3. Centralized logic
        const res = await fetch('/api/sessions', { cache: 'no-store' }); // Ensure fresh data
        if (!res.ok) throw new Error('Failed to fetch sessions');

        const data = await res.json();

        // Cast the category string from DB to our specific union type
        return (data || []).map((item: any) => ({
            ...item,
            category: item.category as Session['category']
        }));
    } catch (error) {
        console.error('Error fetching real sessions via API:', error);
        return [];
    }
}

// --- Mock Data Fetcher ---
async function fetchSessionsMock(): Promise<Session[]> {
    console.log("--- DEBUG: Using Mock Data for Sessions ---");
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));

    return MOCK_SESSIONS;
}

// --- The Exported Conditional Function (THE SWITCH) ---
export const fetchSessions = isMockMode ? fetchSessionsMock : fetchSessionsReal;