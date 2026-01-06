import axios, { AxiosInstance } from 'axios';
import { API_URL } from '../config/api';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  DiscoverableUser,
  Match,
  Conversation,
  Message,
  LikeRequest,
  MessageRequest,
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include token
    this.api.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  // Authentication
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<{ success: boolean; data: AuthResponse }>('/api/auth/register', data);
    return response.data.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<{ success: boolean; data: AuthResponse }>('/api/auth/login', data);
    return response.data.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<{ success: boolean; data: User }>('/api/auth/me');
    return response.data.data;
  }

  // User Profile
  async getProfile(userId?: string): Promise<User> {
    const url = userId ? `/api/users/profile/${userId}` : '/api/users/profile';
    const response = await this.api.get<User>(url);
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.api.put<User>('/api/users/profile', data);
    return response.data;
  }

  // Discovery
  async getDiscoverableUsers() {
    const response = await this.api.get<DiscoverableUser[]>('/api/discovery');
    return response;
  }

  async likeUser(toUserId: string): Promise<{ match: boolean; matchId?: string }> {
    const response = await this.api.post<{ success: boolean; data: { matched: boolean; matchId?: string } }>(
      '/api/discovery/like',
      { toUserId }
    );

    const data = response.data.data;

    if (!data) {
      throw new Error('Invalid like response');
    }

    return {
      match: data.matched,
      matchId: data.matchId,
    };
  }

  async dislikeUser(toUserId: string): Promise<{ success: boolean }> {
    const response = await this.api.post<{ success: boolean }>('/api/discovery/dislike', {
      toUserId,
    });
    return response.data;
  }

  // Matches
  async getMatches(): Promise<Match[]> {
    const response = await this.api.get<Match[]>('/api/matches');
    return response.data;
  }

  // Conversations
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await this.api.get<Conversation>(`/api/conversations/${conversationId}`);
    return response.data;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await this.api.get<Message[]>(`/api/conversations/${conversationId}/messages`);
    return response.data;
  }

  // Messages
  async sendTextMessage(data: MessageRequest): Promise<Message> {
    const response = await this.api.post<Message>('/api/messages/text', data);
    return response.data;
  }
}

export default new ApiService();
