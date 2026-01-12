import { Server, Socket } from 'socket.io';
import { AuthService } from '../services/auth.service';
import { MessageService } from '../services/message.service';
import { ConversationService } from '../services/conversation.service';
const MAX_MESSAGE_LENGTH = 1000;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  currentConversationId?: string;
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

    const cleanAndJoinConversation = (conversationId: string) => {
      if (socket.currentConversationId === conversationId && socket.rooms.size <= 2) {
        return;
      }

      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.leave(room);
        }
      }

      socket.currentConversationId = conversationId;
      socket.join(conversationId);
    };

    console.log(`Client connected: ${socket.id} (User: ${socket.userId})`);

    socket.on(
      'join:conversation',
      withErrorHandling(async (data: JoinRoomData) => {
        const conversationId = (data?.conversationId ?? '').trim();
        if (!conversationId) {
          throw new Error('Conversation invalide');
        }

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
      'message:text',
      withErrorHandling(async (data: TextMessageData) => {
        const conversationId = (data?.conversationId ?? '').trim();
        const content = data?.content;

        requireAuth();
        if (!conversationId) {
          throw new Error('Conversation invalide');
        }
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

        const result = await MessageService.sendTextMessage(conversationId, socket.userId!, sanitizedContent);
        const systemMessage = result.systemMessage;
        // MessageService exposes chapterChanged when progression occurs; use it directly to drive unlock notifications
        const justUnlockedChapter = Boolean(result.chapterChanged);

        const revealLevel = result.revealLevel ?? null;

        // Forward backend-computed payload as-is; no recalculation here to avoid duplicate work on the frontend
        io.to(conversationId).emit('message:new', {
          message: result.message,
          revealLevel,
          textMessageCount: result.textMessageCount,
          chapter: result.chapter,
          chapterChanged: result.chapterChanged,
          systemMessage,
          justUnlockedChapter,
        });

        // Emit a dedicated event only when a new chapter is actually unlocked
        if (justUnlockedChapter) {
          io.to(conversationId).emit('chapter:unlocked', {
            conversationId,
            chapter: result.chapter,
            revealLevel,
            systemMessage: result.systemMessage,
          });
        }

        console.log(`Text message sent in conversation ${conversationId}`);
      })
    );

    socket.on(
      'message:voice',
      withErrorHandling(async (data: VoiceMessageData) => {
        const conversationId = (data?.conversationId ?? '').trim();
        const audioUrl = (data?.audioUrl ?? '').trim();
        const audioDuration = data?.audioDuration;

        requireAuth();
        if (!conversationId) {
          throw new Error('Conversation invalide');
        }
        if (socket.currentConversationId !== conversationId) {
          throw new Error('Rejoignez la conversation avant d’envoyer un message');
        }

        if (!audioUrl) {
          throw new Error('Audio manquant');
        }

        if (!audioDuration || audioDuration <= 0) {
          throw new Error('Durée audio invalide');
        }

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
