import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserService } from '../services/user.service';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.userId || req.user!.userId;

      const user = await UserService.getUserById(userId, req.user?.userId);

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
      const { name, firstName, lastName, age, gender, interestedIn, city, description, photoUrl } = req.body;
      const normalizedPhotoUrl = photoUrl === null ? '' : photoUrl;

      const interestedInList =
        interestedIn === undefined
          ? undefined
          : Array.isArray(interestedIn)
            ? interestedIn
            : typeof interestedIn === 'string'
              ? interestedIn.split(',').map((value: string) => value.trim()).filter(Boolean)
              : [];

      const user = await UserService.updateProfile(userId, {
        name,
        firstName,
        lastName,
        age: age ? parseInt(age) : undefined,
        gender,
        interestedIn: interestedInList,
        city,
        description,
        photoUrl: normalizedPhotoUrl,
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
        message: 'Compte désactivé avec succès',
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
        message: 'Compte supprimé avec succès',
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
