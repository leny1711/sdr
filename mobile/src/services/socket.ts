import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/theme';
import { Message } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    
    if (this.socket?.connected) {
      return;
    }

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

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  // Join a conversation
  joinConversation(conversationId: string) {
    this.socket?.emit('join:conversation', { conversationId });
  }

  // Leave a conversation
  leaveConversation(conversationId: string) {
    this.socket?.emit('leave:conversation', { conversationId });
  }

  // Send a text message
  sendTextMessage(conversationId: string, content: string) {
    this.socket?.emit('message:text', { conversationId, content });
  }

  // Listen for new messages
  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('message:new', callback);
  }

  // Remove message listener
  offNewMessage(callback?: (message: Message) => void) {
    if (callback) {
      this.socket?.off('message:new', callback);
    } else {
      this.socket?.off('message:new');
    }
  }

  // Send typing start event
  startTyping(conversationId: string) {
    this.socket?.emit('typing:start', { conversationId });
  }

  // Send typing stop event
  stopTyping(conversationId: string) {
    this.socket?.emit('typing:stop', { conversationId });
  }

  // Listen for typing events
  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.on('typing:user', callback);
  }

  // Remove typing listener
  offUserTyping(callback?: (data: { userId: string; isTyping: boolean }) => void) {
    if (callback) {
      this.socket?.off('typing:user', callback);
    } else {
      this.socket?.off('typing:user');
    }
  }
}

export default new SocketService();
