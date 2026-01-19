export type UserRole = 'player' | 'parent' | 'coach' | 'admin' | 'sys-admin';

export type Tab = 'home' | 'profile' | 'qr' | 'schedule' | 'community';

export interface NewsItem {
    id: string;
    title: string;
    subtitle: string;
    image: string;
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
    membership_start?: string;
    membership_expires?: string;
    membership_history?: any[];
}