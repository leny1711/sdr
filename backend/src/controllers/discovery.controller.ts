import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { DiscoveryService } from '../services/discovery.service';

export class DiscoveryController {
  static async getDiscoverableUsers(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 10;

      const users = await DiscoveryService.getDiscoverableUsers(userId, limit);

      return res.status(200).json({
        success: true,
        data: users,
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

  static async likeUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { toUserId } = req.body;

      const result = await DiscoveryService.likeUser(userId, toUserId);

      return res.status(200).json({
        success: true,
        data: {
          matched: !!result.match,
          matchId: result.match?.id,
        },
        message: result.match ? 'It\'s a match!' : 'Like sent',
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

  static async dislikeUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { toUserId } = req.body;

      const result = await DiscoveryService.dislikeUser(userId, toUserId);

      return res.status(200).json({
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
}
