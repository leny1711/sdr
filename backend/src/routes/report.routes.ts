import { Router } from 'express';
import { body } from 'express-validator';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  validate([
    body('reportedId').notEmpty().withMessage('reportedId is required'),
    body('reason').notEmpty().withMessage('reason is required'),
  ]),
  ReportController.reportUser
);

router.get('/', authenticate, ReportController.getReports);

export default router;
