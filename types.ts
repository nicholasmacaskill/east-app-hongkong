export type Tab = 'home' | 'profile' | 'qr' | 'schedule' | 'community';

export interface User {
  name: string;
  role: 'player' | 'parent';
  avatar: string;
  points: number;
  memberSince: string;
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
