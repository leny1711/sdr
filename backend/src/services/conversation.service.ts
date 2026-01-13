import prisma from '../config/database';
import { applyRevealToUser, normalizePhotoUrl } from '../utils/reveal.utils';
import { ConversationProgressionService } from './conversationProgression.service';

export class ConversationService {
  static async getConversation(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            age: true,
            gender: true,
            city: true,
            description: true,
            interestedIn: true,
            photoUrl: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            age: true,
            gender: true,
            city: true,
            description: true,
            interestedIn: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation introuvable');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new Error('Accès non autorisé à cette conversation');
    }

    const progression = await ConversationProgressionService.recompute(conversationId);
    const revealLevel = progression.revealLevel ?? 0;
    const otherUser = applyRevealToUser(
      conversation.user1Id === userId ? conversation.user2 : conversation.user1,
      revealLevel
    );

    return {
      ...conversation,
      ...progression,
      user1:
        conversation.user1Id === userId
          ? { ...conversation.user1, photoUrl: normalizePhotoUrl(conversation.user1.photoUrl) }
          : applyRevealToUser(conversation.user1, revealLevel),
      user2:
        conversation.user2Id === userId
          ? { ...conversation.user2, photoUrl: normalizePhotoUrl(conversation.user2.photoUrl) }
          : applyRevealToUser(conversation.user2, revealLevel),
      otherUser,
    };
  }

  static async getMessages(conversationId: string, userId: string, limit: number = 50, cursor?: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation introuvable');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new Error('Accès non autorisé à cette conversation');
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const cursorDate = cursor ? new Date(cursor) : undefined;
    if (cursorDate && isNaN(cursorDate.getTime())) {
      throw new Error('Curseur de pagination invalide');
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(cursorDate && {
          createdAt: {
            lt: cursorDate,
          },
        }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: safeLimit + 1,
    });

    const hasMore = messages.length > safeLimit;
    const pageMessages = hasMore ? messages.slice(0, safeLimit) : messages;
    const oldestMessage = pageMessages.length > 0 ? pageMessages[pageMessages.length - 1] : undefined;
    const orderedMessages = pageMessages.reverse();
    const nextCursor = hasMore && oldestMessage ? oldestMessage.createdAt.toISOString() : null;

    return {
      messages: orderedMessages,
      nextCursor,
    };
  }

}
