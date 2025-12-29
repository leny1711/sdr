export interface JWTPayload {
  userId: string;
  email: string;
}

export type RevealLevel = 0 | 1 | 2 | 3;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
