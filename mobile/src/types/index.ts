export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  city: string;
  description: string;
  photoUrl?: string | null;
  createdAt: string;
}

export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  conversationId: string;
  createdAt: string;
  matchedUser: User;
  conversation: Conversation;
}

export interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  revealLevel: number;
  textMessageCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'TEXT' | 'VOICE';
  content: string;
  voiceUrl?: string | null;
  createdAt: string;
  sender?: User;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  age: number;
  city: string;
  description: string;
}

export interface DiscoverableUser extends User {
  // Additional fields if needed for discovery
}

export interface LikeRequest {
  targetUserId: string;
}

export interface MessageRequest {
  conversationId: string;
  content: string;
}
