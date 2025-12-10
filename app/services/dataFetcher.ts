import { MOCK_SESSIONS } from '@/app/mocking/sessions';
import { Session } from '@/app/types/session';

// IMPORTANT: This flag must be read from NEXT_PUBLIC_... for client-side components to work.
const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// --- Real Data Fetcher (Calls the actual API route) ---
async function fetchSessionsReal(): Promise<Session[]> {
    // We are calling the API route you already created: app/api/sessions/route.ts
    const res = await fetch('/api/sessions');

    if (!res.ok) {
        console.error(`Failed to fetch real sessions: ${res.status}`);
        return [];
    }
    return res.json();
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