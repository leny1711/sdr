import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

// Rate limiter for profile routes - 100 requests per 15 minutes
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/profile', profileLimiter, authenticate, UserController.getProfile);
router.get('/profile/:userId', profileLimiter, authenticate, UserController.getProfile);

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
