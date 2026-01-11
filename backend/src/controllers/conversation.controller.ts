import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ConversationService } from '../services/conversation.service';

export class ConversationController {
  static async getConversation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { conversationId } = req.params;

      const conversation = await ConversationService.getConversation(userId, conversationId);

      return res.status(200).json({
        success: true,
        data: conversation,
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

  static async getMessages(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { conversationId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const cursor = (req.query.cursor as string) || (req.query.before as string);

      const { messages, nextCursor } = await ConversationService.getMessages(conversationId, userId, limit, cursor);

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
}
