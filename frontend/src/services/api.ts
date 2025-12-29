import axios from 'axios';
import type { 
  AuthResponse, 
  LoginData, 
  RegisterData, 
  User, 
  Match,
  ConversationWithMessages,
  Message
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async (userId?: string): Promise<User> => {
    const url = userId ? `/api/users/profile/${userId}` : '/api/users/profile';
    const response = await api.get(url);
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/api/users/profile', data);
    return response.data;
  },

  deactivate: async (): Promise<void> => {
    await api.post('/api/users/deactivate');
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('/api/users/delete');
  },
};

// Discovery API
export const discoveryAPI = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/api/discovery');
    return response.data;
  },

  like: async (userId: string): Promise<{ matched: boolean; matchId?: string }> => {
    const response = await api.post('/api/discovery/like', { likedUserId: userId });
    return response.data;
  },

  dislike: async (userId: string): Promise<void> => {
    await api.post('/api/discovery/dislike', { dislikedUserId: userId });
  },
};

// Match API
export const matchAPI = {
  getMatches: async (): Promise<Match[]> => {
    const response = await api.get('/api/matches');
    return response.data;
  },
};

// Conversation API
export const conversationAPI = {
  getConversation: async (conversationId: string): Promise<ConversationWithMessages> => {
    const response = await api.get(`/api/conversations/${conversationId}`);
    return response.data;
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await api.get(`/api/conversations/${conversationId}/messages`);
    return response.data;
  },
};

// Message API
export const messageAPI = {
  sendText: async (conversationId: string, content: string): Promise<Message> => {
    const response = await api.post('/api/messages/text', { conversationId, content });
    return response.data;
  },

  sendVoice: async (conversationId: string, audioUrl: string): Promise<Message> => {
    const response = await api.post('/api/messages/voice', { conversationId, audioUrl });
    return response.data;
  },
};

// Block API
export const blockAPI = {
  blockUser: async (userId: string): Promise<void> => {
    await api.post('/api/blocks', { blockedUserId: userId });
  },

  unblockUser: async (userId: string): Promise<void> => {
    await api.delete('/api/blocks', { data: { blockedUserId: userId } });
  },

  getBlocked: async (): Promise<User[]> => {
    const response = await api.get('/api/blocks');
    return response.data;
  },
};

// Report API
export const reportAPI = {
  reportUser: async (userId: string, reason: string): Promise<void> => {
    await api.post('/api/reports', { reportedUserId: userId, reason });
  },
};

export default api;
