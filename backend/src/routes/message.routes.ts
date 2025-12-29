import { Router } from 'express';
import { body } from 'express-validator';
import { MessageController } from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.post(
  '/text',
  authenticate,
  validate([
    body('conversationId').notEmpty().withMessage('conversationId is required'),
    body('content').notEmpty().withMessage('content is required'),
  ]),
  MessageController.sendTextMessage
);

router.post(
  '/voice',
  authenticate,
  validate([
    body('conversationId').notEmpty().withMessage('conversationId is required'),
    body('audioUrl').notEmpty().withMessage('audioUrl is required'),
    body('audioDuration').isInt({ min: 1 }).withMessage('audioDuration must be a positive integer'),
  ]),
  MessageController.sendVoiceMessage
);

export default router;
