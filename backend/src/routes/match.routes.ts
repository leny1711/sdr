import { Router } from 'express';
import { MatchController } from '../controllers/match.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, MatchController.getMatches);

export default router;
