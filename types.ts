export type Tab = 'home' | 'profile' | 'coach' | 'qr' | 'schedule' | 'community';

export interface User {
  name: string;
  role: 'player' | 'parent';
  avatar: string;
  points: number;
  memberSince: string;
}

export interface UserProfileData {
  name: string;
  surname: string;
  username: string;
  bio: string;
  email: string;
  mobile: string;
  avatar_url?: string;
  credits: number;
  gallery_images: string[];
  schedule_photo_url?: string;
  id?: string;
}

export interface ClassSession {
  id: string;
  title: string;
  category: string;
  image: string;
  time?: string;
  host?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
  avatar: string;
}
