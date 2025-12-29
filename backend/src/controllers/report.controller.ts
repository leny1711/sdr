import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ReportService } from '../services/report.service';

export class ReportController {
  static async reportUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { reportedId, reason } = req.body;

      const report = await ReportService.reportUser(userId, reportedId, reason);

      return res.status(201).json({
        success: true,
        data: report,
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

  static async getReports(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      const reports = await ReportService.getReports(userId);

      return res.status(200).json({
        success: true,
        data: reports,
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
