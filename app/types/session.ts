export interface Session {
  id: number;
  title: string;
  category: 'ADULT' | 'YOUTH' | 'EVENT';
  instructor: string;
  start_time: string; // ISO string
  end_time: string;
  image_url: string;
  description: string;
}