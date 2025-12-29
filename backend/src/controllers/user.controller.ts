import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserService } from '../services/user.service';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.userId || req.user!.userId;

      const user = await UserService.getUserById(userId);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { name, age, city, description, photoUrl } = req.body;

      const user = await UserService.updateProfile(userId, {
        name,
        age: age ? parseInt(age) : undefined,
        city,
        description,
        photoUrl,
      });

      return res.status(200).json({
        success: true,
        data: user,
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

  static async deactivateAccount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      await UserService.deactivateAccount(userId);

      return res.status(200).json({
        success: true,
        message: 'Account deactivated successfully',
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

  static async deleteAccount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      await UserService.deleteAccount(userId);

      return res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
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
