import { supabase } from '@/app/lib/supabase';
import { MOCK_SESSIONS } from '@/app/mocking/sessions';
import { Session } from '@/app/types/session';

// IMPORTANT: This flag must be read from NEXT_PUBLIC_... for client-side components to work.
const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// --- Real Data Fetcher (Calls Supabase Directly) ---
async function fetchSessionsReal(): Promise<Session[]> {
    const now = new Date().toISOString();

    // ✅ THE FIX: Fetch everything where end_time is in the future.
    // This grabs:
    // 1. Future classes (Start > Now)
    // 2. Active News (Start < Now, but End > Now)
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .gte('end_time', now) 
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching real sessions:', error);
        return [];
    }

    // Cast the category string from DB to our specific union type
    return (data || []).map(item => ({
        ...item,
        category: item.category as Session['category']
    }));
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