import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { MessageService } from '../services/message.service';
import { io } from '../server';

export class MessageController {
  static async sendTextMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { conversationId, content } = req.body;

      const result = await MessageService.sendTextMessage(conversationId, userId, content);

      io.to(conversationId).emit('message:new', {
        message: result.message,
        revealLevel: result.revealLevel,
        textMessageCount: result.textMessageCount,
        chapter: result.chapter,
        chapterChanged: result.chapterChanged,
        systemMessage: result.systemMessage,
      });

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
