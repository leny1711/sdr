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
  MessageEnvelope,
  MessagePage,
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
    const response = await this.api.get<{ success: boolean; data: User }>(url);
    return response.data.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.api.put<{ success: boolean; data: User }>('/api/users/profile', data);
    return response.data.data;
  }

  // Discovery
  async getDiscoverableUsers(): Promise<DiscoverableUser[]> {
    const response = await this.api.get<{ success: boolean; data: DiscoverableUser[] }>('/api/discovery');
    return response.data.data;
  }

  async likeUser(toUserId: string): Promise<{ match: boolean; matchId?: string }> {
    const response = await this.api.post<{ success: boolean; data: { matched: boolean; matchId?: string } }>(
      '/api/discovery/like',
      { toUserId }
    );

    const data = response.data.data;

    if (!data) {
      throw new Error('Réponse de like invalide');
    }

    return {
      match: data.matched,
      matchId: data.matchId,
    };
  }

  /**
   * Dislike a user. The response data is not currently used by the UI.
   * Response type uses 'unknown' to acknowledge data exists but is unused.
   */
  async dislikeUser(toUserId: string): Promise<void> {
    await this.api.post<{ success: boolean; data: unknown }>('/api/discovery/dislike', {
      toUserId,
    });
  }

  // Matches
  async getMatches(): Promise<Match[]> {
    const response = await this.api.get<{ success: boolean; data: Match[] }>('/api/matches');
    return response.data.data;
  }

  // Conversations
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await this.api.get<{ success: boolean; data: Conversation }>(`/api/conversations/${conversationId}`);
    return response.data.data;
  }

  async getMessages(conversationId: string, cursor?: string, limit: number = 50): Promise<MessagePage> {
    const response = await this.api.get<{ success: boolean; data: MessagePage }>(
      `/api/conversations/${conversationId}/messages`,
      {
        params: {
          limit,
          ...(cursor ? { cursor } : {}),
        },
      }
    );
    return response.data.data;
  }

  // Messages
  async sendTextMessage(data: MessageRequest): Promise<MessageEnvelope> {
    const response = await this.api.post<{ success: boolean; data: MessageEnvelope }>('/api/messages/text', data);
    return response.data.data;
  }
}

export default new ApiService();
