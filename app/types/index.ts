// Unified Type Definitions
export * from './calendar';
export * from './community';
export * from './facility';
export * from './stats';

// --- Shared Core Types ---

export type UserRole = 'player' | 'parent' | 'coach' | 'admin' | 'sys-admin';

export type Tab = 'home' | 'profile' | 'qr' | 'schedule' | 'community';

export type ServiceCategory = 'CLASS' | 'PRIVATE' | 'FACILITY' | 'EVENT' | 'NEWS' | 'ADULT' | 'YOUTH' | 'general';

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
    parent_id?: string;
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

    // Unified Category (String fallback for legacy, but prefers Union)
    category?: ServiceCategory | string;

    instructor?: string; // Legacy string match
    start_time: string;
    end_time: string;
    image_url?: string;
    coach_image_url?: string;

    max_capacity?: number;
    credit_cost?: number;
    session_type_id?: number | null | string; // Handled as string in legacy, number in DB

    facility_id?: string;
    facility?: {
        id: string;
        name: string;
        image_url?: string;
    };

    // Relations
    registrations?: Registration[];

    // Client-side / Computed
    type?: 'session';
    attendees?: { id: string; name: string; role?: string }[]; // Admin view
    attendee?: { id: string; first_name: string; last_name: string; role: string }; // User view
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
