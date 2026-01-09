export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: string;
  matchPreference: string;
  city: string;
  description: string;
  photoUrl?: string | null;
  createdAt: string;
}

export interface Match {
  /**
   * Unique identifier for the match coming from the backend.
   * Use this or the conversation.id as the stable key.
   */
  matchedId: string;
  createdAt: string;
  user: User;
  conversation: Conversation;
  // Legacy fields kept optional for backward compatibility with older responses; remove once clients use the new shape everywhere.
  matchedUser?: User;
  conversationId?: string;
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
  gender: string;
  matchPreference: string;
  city: string;
  description: string;
  photoUrl: string;
}

export interface DiscoverableUser extends User {
  // Additional fields if needed for discovery
}

export interface LikeRequest {
  toUserId: string;
}

export interface MessageRequest {
  conversationId: string;
  content: string;
}
