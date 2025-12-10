import { Session } from '@/app/types/session';

// Helper to ensure mock data shows up as "upcoming" in the UI
const MS_PER_HOUR = 3600000;
const now = Date.now();

export const MOCK_SESSIONS: Session[] = [
    // --- ADULT MOCK (for Adult Classes section) ---
    {
        id: 501,
        title: 'Mock Adult Hockey Drills',
        category: 'ADULT',
        instructor: 'Coach Mock',
        start_time: new Date(now + 1 * MS_PER_HOUR).toISOString(),
        end_time: new Date(now + 2 * MS_PER_HOUR).toISOString(),
        image_url: 'https://placehold.co/400x200/F00/white?text=MOCK+ADULT',
        description: 'A mock high-intensity skill session for testing the component grouping.',
    },
    {
        id: 502,
        title: 'Mock Adult Hockey Drills', // Same title for grouping test
        category: 'ADULT',
        instructor: 'Coach Mock',
        start_time: new Date(now + 3 * MS_PER_HOUR).toISOString(),
        end_time: new Date(now + 4 * MS_PER_HOUR).toISOString(),
        image_url: 'https://placehold.co/400x200/F00/white?text=MOCK+ADULT',
        description: 'Testing multiple time slots under the same session title.',
    },
    
    // --- YOUTH MOCK (for Youth Classes section) ---
    {
        id: 601,
        title: 'Mock Youth Skating Fundamentals',
        category: 'YOUTH',
        instructor: 'Coach Test',
        start_time: new Date(now + 5 * MS_PER_HOUR).toISOString(),
        end_time: new Date(now + 6 * MS_PER_HOUR).toISOString(),
        image_url: 'https://placehold.co/400x200/00F/white?text=MOCK+YOUTH',
        description: 'A basic youth class to ensure the youth list renders correctly.',
    },
    
    // --- NEWS MOCK (for Breaking News section) ---
    {
        id: 801,
        title: 'MOCK NEWS: UI Mocking Enabled!',
        category: 'NEWS',
        instructor: 'System',
        start_time: new Date(now - 1 * MS_PER_HOUR).toISOString(), // Past event, but visible in News
        end_time: new Date(now - 1 * MS_PER_HOUR).toISOString(),
        image_url: 'https://images.unsplash.com/photo-1555685812-8b9c85c7954c?auto=format&fit=crop&q=80&w=1000',
        description: 'This is a mock news item designed to test the news card UI.',
    },
    
    // --- FACILITY MOCK (for Facility Booking section) ---
    {
        id: 901,
        title: 'Mock Facility: Shooting Pad',
        category: 'FACILITY',
        instructor: 'Facility',
        start_time: new Date(now + 7 * MS_PER_HOUR).toISOString(), 
        end_time: new Date(now + 8 * MS_PER_HOUR).toISOString(),
        image_url: 'https://placehold.co/400x200/000/white?text=SHOOTING+PAD',
        description: 'Mock data for facility booking testing.',
    },
];