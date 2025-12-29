import { Server, Socket } from 'socket.io';
import { AuthService } from '../services/auth.service';
import { MessageService } from '../services/message.service';
import { ConversationService } from '../services/conversation.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
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
    console.log(`Client connected: ${socket.id} (User: ${socket.userId})`);

    socket.on('join:conversation', async (data: JoinRoomData) => {
      try {
        const { conversationId } = data;

        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const conversation = await ConversationService.getConversation(socket.userId, conversationId);

        socket.join(conversationId);

        socket.emit('conversation:joined', {
          conversationId,
          conversation,
        });

        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      } catch (error) {
        if (error instanceof Error) {
          socket.emit('error', { message: error.message });
        }
      }
    });

    socket.on('leave:conversation', (data: JoinRoomData) => {
      const { conversationId } = data;
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    socket.on('message:text', async (data: TextMessageData) => {
      try {
        const { conversationId, content } = data;

        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const result = await MessageService.sendTextMessage(conversationId, socket.userId, content);

        io.to(conversationId).emit('message:new', {
          message: result.message,
          revealLevel: result.revealLevel,
        });

        console.log(`Text message sent in conversation ${conversationId}`);
      } catch (error) {
        if (error instanceof Error) {
          socket.emit('error', { message: error.message });
        }
      }
    });

    socket.on('message:voice', async (data: VoiceMessageData) => {
      try {
        const { conversationId, audioUrl, audioDuration } = data;

        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const message = await MessageService.sendVoiceMessage(
          conversationId,
          socket.userId,
          audioUrl,
          audioDuration
        );

        io.to(conversationId).emit('message:new', {
          message,
        });

        console.log(`Voice message sent in conversation ${conversationId}`);
      } catch (error) {
        if (error instanceof Error) {
          socket.emit('error', { message: error.message });
        }
      }
    });

    socket.on('typing:start', (data: TypingData) => {
      const { conversationId } = data;
      socket.to(conversationId).emit('typing:user', {
        userId: socket.userId,
        isTyping: true,
      });
    });

    socket.on('typing:stop', (data: TypingData) => {
      const { conversationId } = data;
      socket.to(conversationId).emit('typing:user', {
        userId: socket.userId,
        isTyping: false,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id} (User: ${socket.userId})`);
    });
  });
};
