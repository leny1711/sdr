import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:conversationId', authenticate, ConversationController.getConversation);

router.get('/:conversationId/messages', authenticate, ConversationController.getMessages);

export default router;
