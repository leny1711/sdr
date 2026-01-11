import { Server, Socket } from 'socket.io';
import { AuthService } from '../services/auth.service';
import { MessageService } from '../services/message.service';
import { ConversationService } from '../services/conversation.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  currentConversationId?: string;
  lastMessageAt?: number;
}

interface JoinRoomData {
  conversationId: string;
}

interface TextMessageData {
  conversationId: string;
  content: string;
}

interface VoiceMessageData {
  conversationId: string;
  audioUrl: string;
  audioDuration: number;
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
    const MESSAGE_RATE_LIMIT_MS = 400;
    const MAX_MESSAGE_LENGTH = 1000;

    const handleError = (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      socket.emit('error', { message });
    };

    const withErrorHandling =
      (handler: (...args: any[]) => Promise<void> | void) =>
      (...args: any[]) => {
        Promise.resolve(handler(...args)).catch(handleError);
      };

    const requireAuth = () => {
      if (!socket.userId) {
        throw new Error('Not authenticated');
      }
    };

    const cleanAndJoinConversation = (conversationId: string) => {
      for (const room of socket.rooms) {
        if (room !== socket.id && room !== conversationId) {
          socket.leave(room);
        }
      }

      if (socket.currentConversationId && socket.currentConversationId !== conversationId) {
        socket.leave(socket.currentConversationId);
      }

      socket.currentConversationId = conversationId;
      socket.join(conversationId);
    };

    const enforceSocketRateLimit = () => {
      const now = Date.now();
      if (socket.lastMessageAt && now - socket.lastMessageAt < MESSAGE_RATE_LIMIT_MS) {
        throw new Error('Envoi du message impossible. Merci de patienter quelques instants.');
      }
      socket.lastMessageAt = now;
    };

    console.log(`Client connected: ${socket.id} (User: ${socket.userId})`);

    socket.on(
      'join:conversation',
      withErrorHandling(async (data: JoinRoomData) => {
        const { conversationId } = data;

        requireAuth();

        const conversation = await ConversationService.getConversation(socket.userId!, conversationId);

        cleanAndJoinConversation(conversationId);

        socket.emit('conversation:joined', {
          conversationId,
          conversation,
        });

        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      })
    );

    socket.on(
      'leave:conversation',
      withErrorHandling((data: JoinRoomData) => {
        const { conversationId } = data;
        socket.leave(conversationId);
        if (socket.currentConversationId === conversationId) {
          socket.currentConversationId = undefined;
        }
        console.log(`User ${socket.userId} left conversation ${conversationId}`);
      })
    );

    socket.on(
      'message:text',
      withErrorHandling(async (data: TextMessageData) => {
        const { conversationId, content } = data;

        requireAuth();
        if (socket.currentConversationId !== conversationId) {
          throw new Error('Rejoignez la conversation avant d’envoyer un message');
        }

        const sanitizedContent = (content ?? '').trim();
        if (!sanitizedContent) {
          throw new Error('Message vide');
        }

        if (sanitizedContent.length > MAX_MESSAGE_LENGTH) {
          throw new Error('Message trop long');
        }

        enforceSocketRateLimit();

        const result = await MessageService.sendTextMessage(conversationId, socket.userId!, sanitizedContent);
        const justUnlockedChapter = Boolean(result.chapterChanged);

        io.to(conversationId).emit('message:new', {
          message: result.message,
          revealLevel: result.revealLevel,
          textMessageCount: result.textMessageCount,
          chapter: result.chapter,
          chapterChanged: result.chapterChanged,
          systemMessage: result.systemMessage,
          justUnlockedChapter,
        });

        if (justUnlockedChapter && result.systemMessage) {
          io.to(conversationId).emit('chapter:unlocked', {
            conversationId,
            chapter: result.chapter,
            revealLevel: result.revealLevel,
            systemMessage: result.systemMessage,
          });
        }

        console.log(`Text message sent in conversation ${conversationId}`);
      })
    );

    socket.on(
      'message:voice',
      withErrorHandling(async (data: VoiceMessageData) => {
        const { conversationId, audioUrl, audioDuration } = data;

        requireAuth();
        if (socket.currentConversationId !== conversationId) {
          throw new Error('Rejoignez la conversation avant d’envoyer un message');
        }

        enforceSocketRateLimit();

        const message = await MessageService.sendVoiceMessage(
          conversationId,
          socket.userId!,
          audioUrl,
          audioDuration
        );

        io.to(conversationId).emit('message:new', {
          message,
        });

        console.log(`Voice message sent in conversation ${conversationId}`);
      })
    );

    socket.on(
      'typing:start',
      withErrorHandling((data: TypingData) => {
        const { conversationId } = data;
        if (socket.currentConversationId !== conversationId) {
          return;
        }
        socket.to(conversationId).emit('typing:user', {
          userId: socket.userId,
          isTyping: true,
        });
      })
    );

    socket.on(
      'typing:stop',
      withErrorHandling((data: TypingData) => {
        const { conversationId } = data;
        if (socket.currentConversationId !== conversationId) {
          return;
        }
        socket.to(conversationId).emit('typing:user', {
          userId: socket.userId,
          isTyping: false,
        });
      })
    );

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id} (User: ${socket.userId})`);
    });
  });
};
