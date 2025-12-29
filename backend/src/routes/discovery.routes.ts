import { Router } from 'express';
import { body } from 'express-validator';
import { DiscoveryController } from '../controllers/discovery.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

router.get('/', authenticate, DiscoveryController.getDiscoverableUsers);

router.post(
  '/like',
  authenticate,
  validate([body('toUserId').notEmpty().withMessage('toUserId is required')]),
  DiscoveryController.likeUser
);

router.post(
  '/dislike',
  authenticate,
  validate([body('toUserId').notEmpty().withMessage('toUserId is required')]),
  DiscoveryController.dislikeUser
);

export default router;
