// User types
export interface User {
  id: string;
  email: string;
  username: string;
  age: number;
  city: string;
  description: string;
  photoUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
}

// JWT payload
export interface JWTPayload {
  userId: string;
  email: string;
}

// Message types
export enum MessageType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content?: string | null;
  audioUrl?: string | null;
  audioDuration?: number | null;
  createdAt: Date;
}

// Reveal level (0-3)
export type RevealLevel = 0 | 1 | 2 | 3;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
