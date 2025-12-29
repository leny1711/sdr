import { Router } from 'express';
import { body } from 'express-validator';
import { BlockController } from '../controllers/block.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  validate([body('blockedId').notEmpty().withMessage('blockedId is required')]),
  BlockController.blockUser
);

router.delete(
  '/',
  authenticate,
  validate([body('blockedId').notEmpty().withMessage('blockedId is required')]),
  BlockController.unblockUser
);

router.get('/', authenticate, BlockController.getBlockedUsers);

export default router;
