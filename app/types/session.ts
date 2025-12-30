export interface Session {
    id: number;
    title: string;
    category: 'CLASS' | 'PRIVATE' | 'FACILITY' | 'EVENT' | 'NEWS' | 'ADULT' | 'YOUTH';
    instructor: string;
    start_time: string;
    end_time: string;
    image_url?: string;
    coach_image_url?: string; // New field
    description?: string;
    credit_cost?: number;
}