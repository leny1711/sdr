import axios, { AxiosInstance } from 'axios';
import { API_URL } from '../constants/theme';
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
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/auth/me');
    return response.data;
  }

  // User Profile
  async getProfile(userId?: string): Promise<User> {
    const url = userId ? `/users/profile/${userId}` : '/users/profile';
    const response = await this.api.get<User>(url);
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.api.put<User>('/users/profile', data);
    return response.data;
  }

  // Discovery
  async getDiscoverableUsers(): Promise<DiscoverableUser[]> {
    const response = await this.api.get<DiscoverableUser[]>('/discovery');
    return response.data;
  }

  async likeUser(targetUserId: string): Promise<{ match: boolean; conversation?: Conversation }> {
    const response = await this.api.post<{ match: boolean; conversation?: Conversation }>(
      '/discovery/like',
      { targetUserId }
    );
    return response.data;
  }

  async dislikeUser(targetUserId: string): Promise<{ success: boolean }> {
    const response = await this.api.post<{ success: boolean }>('/discovery/dislike', {
      targetUserId,
    });
    return response.data;
  }

  // Matches
  async getMatches(): Promise<Match[]> {
    const response = await this.api.get<Match[]>('/matches');
    return response.data;
  }

  // Conversations
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await this.api.get<Conversation>(`/conversations/${conversationId}`);
    return response.data;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await this.api.get<Message[]>(`/conversations/${conversationId}/messages`);
    return response.data;
  }

  // Messages
  async sendTextMessage(data: MessageRequest): Promise<Message> {
    const response = await this.api.post<Message>('/messages/text', data);
    return response.data;
  }
}

export default new ApiService();
