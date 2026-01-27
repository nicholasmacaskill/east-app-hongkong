export type UserRole = 'player' | 'parent' | 'coach' | 'admin' | 'sys-admin';

export type Tab = 'home' | 'profile' | 'qr' | 'schedule' | 'community';

export interface NewsItem {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    description?: string;
}

export interface UserProfileData {
    name: string;
    surname: string;
    first_name: string;
    last_name: string;
    username: string;
    bio: string;
    email: string;
    mobile: string;
    avatar_url?: string;
    credits: number;
    gallery_images: string[];
    schedule_photo_url?: string;
    role?: UserRole;
    intro_video_url?: string;
    id?: string;
    preferences?: any;
    subscription_status?: string;
    account_status?: string;
    membership_start?: string;
    membership_expires?: string;
    membership_history?: any[];
}

export interface Registration {
    id?: number;
    user_id: string;
    session_id: number;
    registered_at?: string;
    payer_id?: string;
    profiles?: UserProfileData; // Joined profile data
}

export interface Session {
    id: number;
    title: string;
    description?: string;
    category?: string;
    instructor?: string; // Legacy string match, will be reinforced by logic
    start_time: string;
    end_time: string;
    image_url?: string;
    coach_image_url?: string;
    max_capacity?: number;
    credit_cost?: number;
    registrations?: Registration[];
    session_type_id?: number | null;
    // Computed/Client-side props
    type?: 'session';
    attendees?: { id: string; name: string; role?: string }[];
}

export interface Availability {
    id: string;
    coach_id: string;
    start_time: string;
    end_time: string;
    is_recurring?: boolean;
    status: 'available' | 'booked' | 'unavailable';
    created_at?: string;
    profiles?: UserProfileData; // Joined coach data
    // Computed/Client-side props
    type?: 'slot';
    title?: string;
    instructor?: string;
    coach_image_url?: string;
    category?: string;
}

export type ScheduleItem = Session | Availability;