import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async register(req: AuthRequest, res: Response) {
    try {
      const { email, password, name, age, gender, city, description, photoUrl } = req.body;

      const result = await AuthService.register({
        email,
        password,
        name,
        age: parseInt(age),
        gender,
        city,
        description,
        photoUrl,
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

  static async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(401).json({
          success: false,
          error: error.message,
        });
      }
      throw error;
    }
  }

  static async getMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      const { UserService } = await import('../services/user.service');
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
}
