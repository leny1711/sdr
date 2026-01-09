// User types
export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: string;
  interestedIn: string[];
  city: string;
  description: string;
  photoUrl?: string | null;
  photoHidden?: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  age: number;
  gender: string;
  interestedIn: string[];
  city: string;
  description: string;
  photoUrl?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Match & Discovery types
export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  conversationId: string;
  createdAt: string;
  otherUser: User;
  conversation: Conversation;
}

export interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  textMessageCount: number;
  revealLevel: number;
  createdAt: string;
}

// Message types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'TEXT' | 'VOICE';
  content?: string;
  audioUrl?: string;
  createdAt: string;
  sender?: User;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  otherUser: User;
}
