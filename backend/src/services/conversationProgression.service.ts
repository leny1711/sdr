import prisma from '../config/database';
import { computeRevealLevel } from '../utils/reveal.utils';

export class ConversationProgressionService {
  /**
   * Recompute conversation progression based on current text messages without persisting it.
   * @param conversationId Conversation identifier to recalculate.
   * @returns Updated progression data (message count, reveal level, chapter unlock timestamps).
   * @throws Error when the conversation does not exist.
   */
  static async recompute(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        chapter1UnlockedAt: true,
        chapter2UnlockedAt: true,
        chapter3UnlockedAt: true,
        chapter4UnlockedAt: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const textMessageCount = await prisma.message.count({
      where: {
        conversationId,
        type: 'TEXT',
      },
    });

    const revealLevel = computeRevealLevel(textMessageCount);

    return {
      textMessageCount,
      revealLevel,
      chapter1UnlockedAt: conversation.chapter1UnlockedAt ?? null,
      chapter2UnlockedAt: conversation.chapter2UnlockedAt ?? null,
      chapter3UnlockedAt: conversation.chapter3UnlockedAt ?? null,
      chapter4UnlockedAt: conversation.chapter4UnlockedAt ?? null,
    };
  }
}
