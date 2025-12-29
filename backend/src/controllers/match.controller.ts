import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { MatchService } from '../services/match.service';

export class MatchController {
  static async getMatches(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      const matches = await MatchService.getUserMatches(userId);

      return res.status(200).json({
        success: true,
        data: matches,
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
