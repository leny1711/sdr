import { Router } from 'express';
import { body, query } from 'express-validator';
import { MessageController } from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.get(
  '/',
  authenticate,
  validate([
    query('conversationId').notEmpty().withMessage('conversationId is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
    query('before').optional().isISO8601().withMessage('before must be a valid date'),
    query('cursor').optional().isISO8601().withMessage('cursor must be a valid date'),
  ]),
  MessageController.listMessages
);

router.post(
  '/',
  authenticate,
  validate([
    body('conversationId').notEmpty().withMessage('conversationId is required'),
    body('content').notEmpty().withMessage('content is required'),
  ]),
  MessageController.sendTextMessage
);

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
