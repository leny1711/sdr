import { io, Socket } from 'socket.io-client';
import type { Message } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('join:conversation', { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave:conversation', { conversationId });
  }

  sendTextMessage(conversationId: string, content: string) {
    this.socket?.emit('message:text', { conversationId, content });
  }

  sendVoiceMessage(conversationId: string, audioUrl: string) {
    this.socket?.emit('message:voice', { conversationId, audioUrl });
  }

  startTyping(conversationId: string) {
    this.socket?.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.socket?.emit('typing:stop', { conversationId });
  }

  onConversationJoined(callback: (data: any) => void) {
    this.socket?.on('conversation:joined', callback);
  }

  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('message:new', callback);
  }

  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.on('typing:user', callback);
  }

  onError(callback: (error: any) => void) {
    this.socket?.on('error', callback);
  }

  off(event: string, callback?: any) {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
