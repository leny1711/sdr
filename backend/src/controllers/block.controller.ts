import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { BlockService } from '../services/block.service';

export class BlockController {
  static async blockUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { blockedId } = req.body;

      const block = await BlockService.blockUser(userId, blockedId);

      return res.status(201).json({
        success: true,
        data: block,
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

  static async unblockUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { blockedId } = req.body;

      await BlockService.unblockUser(userId, blockedId);

      return res.status(200).json({
        success: true,
        message: 'User unblocked successfully',
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

  static async getBlockedUsers(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      const blockedUsers = await BlockService.getBlockedUsers(userId);

      return res.status(200).json({
        success: true,
        data: blockedUsers,
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
