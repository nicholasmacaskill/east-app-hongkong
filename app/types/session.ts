export interface Session {
    id: number;
    title: string;
    category: 'ADULT' | 'YOUTH' | 'COACH' | 'FACILITY' | 'EVENT' | 'NEWS';
    instructor: string;
    start_time: string;
    end_time: string;
    image_url?: string;
    description?: string;
}