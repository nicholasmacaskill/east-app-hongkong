export interface Post {
  id: number;
  user_id: string;
  username?: string; // Joined field
  avatar_url?: string; // Joined field
  image_url: string;
  caption: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  username?: string;
  content: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  shared_event_id?: number;
  shared_event_title?: string; // For display
  created_at: string;
  is_me?: boolean; // Helper for UI
}

export interface ChatUser {
  user_id: string;
  username: string;
  avatar_url: string;
}