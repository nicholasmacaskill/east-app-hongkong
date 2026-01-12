export type UserRole = 'player' | 'parent' | 'coach' | 'admin' | 'sys-admin';

export type Tab = 'home' | 'profile' | 'qr' | 'schedule' | 'community';

export interface NewsItem {
    id: string;
    title: string;
    subtitle: string;
    image: string;
}