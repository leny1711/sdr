import { Server, Socket } from 'socket.io';
import { AuthService } from '../services/auth.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  currentConversationId?: string;
}

interface JoinRoomData {
  conversationId: string;
}

interface TypingData {
  conversationId: string;
}

export const setupSocketHandlers = (io: Server) => {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = AuthService.verifyToken(token);
      socket.userId = payload.userId;

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const handleError = (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      socket.emit('error', { message });
    };

    const withErrorHandling =
      <T extends any[]>(handler: (...args: T) => Promise<void> | void) =>
      (...args: T) => {
        Promise.resolve(handler(...args)).catch(handleError);
      };

    const requireAuth = () => {
      if (!socket.userId) {
        throw new Error('Authentification requise');
      }
    };

    let lastTypingAt = 0;
    const TYPING_RATE_LIMIT_MS = 800;

    console.log(`Client connected: ${socket.id} (User: ${socket.userId})`);

    socket.on(
      'join:conversation',
      withErrorHandling(async (data: JoinRoomData) => {
        const conversationId = (data?.conversationId ?? '').trim();
        if (!conversationId) {
          throw new Error('Conversation invalide');
        }

        requireAuth();

        for (const room of socket.rooms) {
          if (room !== socket.id) {
            socket.leave(room);
          }
        }

        socket.currentConversationId = conversationId;
        socket.join(conversationId);
        socket.emit('conversation:joined', { conversationId });

        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      })
    );

    socket.on(
      'leave:conversation',
      withErrorHandling((data: JoinRoomData) => {
        const conversationId = (data?.conversationId ?? '').trim();
        if (!conversationId) {
          return;
        }
        socket.leave(conversationId);
        if (socket.currentConversationId === conversationId) {
          socket.currentConversationId = undefined;
        }
        console.log(`User ${socket.userId} left conversation ${conversationId}`);
      })
    );

    socket.on(
      'typing:start',
      withErrorHandling((data: TypingData) => {
        const now = Date.now();
        if (now - lastTypingAt < TYPING_RATE_LIMIT_MS) return;
        lastTypingAt = now;

        const conversationId = (data?.conversationId ?? '').trim();
        if (!conversationId) return;
        if (socket.currentConversationId !== conversationId) return;

        socket.to(conversationId).emit('typing:user', {
          userId: socket.userId,
          isTyping: true,
        });
      })
    );

    socket.on(
      'typing:stop',
      withErrorHandling((data: TypingData) => {
        const now = Date.now();
        if (now - lastTypingAt < TYPING_RATE_LIMIT_MS) return;
        lastTypingAt = now;

        const conversationId = (data?.conversationId ?? '').trim();
        if (!conversationId) return;
        if (socket.currentConversationId !== conversationId) return;

        socket.to(conversationId).emit('typing:user', {
          userId: socket.userId,
          isTyping: false,
        });
      })
    );

    socket.on('disconnect', () => {
      socket.currentConversationId = undefined;
      console.log(`Client disconnected: ${socket.id} (User: ${socket.userId})`);
    });
  });
};
