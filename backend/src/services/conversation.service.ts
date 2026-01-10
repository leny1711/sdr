import prisma from '../config/database';
import {
  applyRevealToUser,
  computeChapterFromMessageCount,
  computeRevealLevel,
  getChapterSystemLabel,
  normalizePhotoUrl,
} from '../utils/reveal.utils';

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

    const revealLevel = computeRevealLevel(conversation.textMessageCount);
    const otherUser = applyRevealToUser(
      conversation.user1Id === userId ? conversation.user2 : conversation.user1,
      revealLevel
    );

    return {
      ...conversation,
      revealLevel,
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

  static async getMessages(conversationId: string, userId: string, limit: number = 50, before?: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation introuvable');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new Error('Accès non autorisé à cette conversation');
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(before && {
          createdAt: {
            lt: new Date(before),
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
      take: limit,
    });

    const ordered = messages.reverse();
    const textMessagesInBatch = ordered.filter((msg) => msg.type === 'TEXT').length;
    let textCount = Math.max(0, conversation.textMessageCount - textMessagesInBatch);
    let currentChapter = computeChapterFromMessageCount(textCount);

    const enhancedMessages = ordered.flatMap((msg) => {
      const result = [msg];
      if (msg.type === 'TEXT') {
        textCount += 1;
        const nextChapter = computeChapterFromMessageCount(textCount);
        if (nextChapter !== currentChapter) {
          currentChapter = nextChapter;
          const systemTime = msg.createdAt.getTime() + 1;
          const systemId = `system-${conversation.id}-${currentChapter}-${systemTime}`;
          result.push({
            id: systemId,
            conversationId: conversation.id,
            senderId: conversation.user1Id,
            type: 'SYSTEM',
            content: getChapterSystemLabel(currentChapter),
            createdAt: new Date(systemTime),
          } as any);
        }
      }
      return result;
    });

    return enhancedMessages;
  }

  static calculateRevealLevel(textMessageCount: number): number {
    return computeRevealLevel(textMessageCount);
  }

  static async updateRevealLevel(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return this.calculateRevealLevel(conversation.textMessageCount);
  }
}
