import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { MessageService } from '../services/message.service';
import { ConversationService } from '../services/conversation.service';

export class MessageController {
  static async sendTextMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { conversationId, content } = req.body;

      const result = await MessageService.sendTextMessage(conversationId, userId, content);

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }
  }

  static async listMessages(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { conversationId } = req.query;
      const limit = parseInt(req.query.limit as string) || 30;
      // Support legacy 'cursor' param alongside the new 'before' query; retire after remaining socket-based clients migrate.
      const before = (req.query.before as string) || (req.query.cursor as string);

      if (!conversationId || typeof conversationId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'conversationId is required',
        });
      }

      const { messages, nextCursor } = await ConversationService.getMessages(conversationId, userId, limit, before);

      return res.status(200).json({
        success: true,
        data: { messages, nextCursor },
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }
  }

  static async sendVoiceMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { conversationId, audioUrl, audioDuration } = req.body;

      const message = await MessageService.sendVoiceMessage(
        conversationId,
        userId,
        audioUrl,
        parseInt(audioDuration)
      );

      return res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }
  }
}
