export interface JWTPayload {
  userId: string;
  email: string;
}

export type RevealLevel = 0 | 1 | 2 | 3 | 4;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type ChapterNumber = 0 | 1 | 2 | 3 | 4;

export interface SystemMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface MessageEnvelope {
  message: any;
  revealLevel: RevealLevel;
  textMessageCount: number;
  chapter: ChapterNumber | null;
  chapterChanged: boolean;
  systemMessage?: SystemMessagePayload;
}
