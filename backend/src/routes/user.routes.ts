import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { rateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

router.get('/profile', rateLimiter, authenticate, UserController.getProfile);
router.get('/profile/:userId', rateLimiter, authenticate, UserController.getProfile);

router.put(
  '/profile',
  authenticate,
  validate([
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('age').optional().isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
    body('city').optional().notEmpty().withMessage('City cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  ]),
  UserController.updateProfile
);

router.post('/deactivate', authenticate, UserController.deactivateAccount);

router.delete('/delete', authenticate, UserController.deleteAccount);

export default router;
