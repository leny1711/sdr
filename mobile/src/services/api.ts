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
    const response = await this.api.post<{ success: boolean; data: AuthResponse }>('/auth/register', data);
    return response.data.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<{ success: boolean; data: AuthResponse }>('/auth/login', data);
    return response.data.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<{ success: boolean; data: User }>('/auth/me');
    return response.data.data;
  }

  // User Profile
  async getProfile(userId?: string): Promise<User> {
    const url = userId ? `/users/profile/${userId}` : '/users/profile';
    const response = await this.api.get<{ success: boolean; data: User }>(url);
    return response.data.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.api.put<{ success: boolean; data: User }>('/users/profile', data);
    return response.data.data;
  }

  // Discovery
  async getDiscoverableUsers(): Promise<DiscoverableUser[]> {
    const response = await this.api.get<{ success: boolean; data: DiscoverableUser[] }>('/discovery');
    return response.data.data;
  }

  async likeUser(targetUserId: string): Promise<{ match: boolean; conversation?: Conversation }> {
    const response = await this.api.post<{ success: boolean; data: { matched: boolean; matchId?: string }; message: string }>(
      '/discovery/like',
      { toUserId: targetUserId }
    );
    return { match: response.data.data.matched, conversation: undefined };
  }

  async dislikeUser(targetUserId: string): Promise<{ success: boolean }> {
    const response = await this.api.post<{ success: boolean; data: any }>('/discovery/dislike', {
      toUserId: targetUserId,
    });
    return { success: response.data.success };
  }

  // Matches
  async getMatches(): Promise<Match[]> {
    const response = await this.api.get<{ success: boolean; data: Match[] }>('/matches');
    return response.data.data;
  }

  // Conversations
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await this.api.get<{ success: boolean; data: Conversation }>(`/conversations/${conversationId}`);
    return response.data.data;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await this.api.get<{ success: boolean; data: Message[] }>(`/conversations/${conversationId}/messages`);
    return response.data.data;
  }

  // Messages
  async sendTextMessage(data: MessageRequest): Promise<Message> {
    const response = await this.api.post<{ success: boolean; data: Message }>('/messages/text', data);
    return response.data.data;
  }
}

export default new ApiService();
