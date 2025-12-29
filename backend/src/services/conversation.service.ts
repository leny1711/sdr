import prisma from '../config/database';

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
            photoUrl: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new Error('Unauthorized access to conversation');
    }

    const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;

    return {
      ...conversation,
      otherUser,
    };
  }

  static async getMessages(conversationId: string, userId: string, limit: number = 50, before?: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new Error('Unauthorized access to conversation');
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

    return messages.reverse();
  }

  static async calculateRevealLevel(textMessageCount: number): Promise<number> {
    if (textMessageCount < 10) return 0;
    if (textMessageCount < 20) return 1;
    if (textMessageCount < 30) return 2;
    return 3;
  }

  static async updateRevealLevel(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const newRevealLevel = await this.calculateRevealLevel(conversation.textMessageCount);

    if (newRevealLevel !== conversation.revealLevel) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { revealLevel: newRevealLevel },
      });
    }

    return newRevealLevel;
  }
}
