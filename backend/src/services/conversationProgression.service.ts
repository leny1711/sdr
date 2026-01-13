import prisma from '../config/database';
import { CHAPTER_THRESHOLDS, computeRevealLevel } from '../utils/reveal.utils';
import { Prisma } from '@prisma/client';

export class ConversationProgressionService {
  /**
   * Recompute and persist conversation progression based on current text messages.
   * @param conversationId Conversation identifier to recalculate.
   * @returns Updated progression data (message count, reveal level, chapter unlock timestamps).
   * @throws Error when the conversation does not exist.
   */
  static async recompute(conversationId: string) {
    type ChapterKey =
      | 'chapter1UnlockedAt'
      | 'chapter2UnlockedAt'
      | 'chapter3UnlockedAt'
      | 'chapter4UnlockedAt';

    const chapterKeys: ChapterKey[] = [
      'chapter1UnlockedAt',
      'chapter2UnlockedAt',
      'chapter3UnlockedAt',
      'chapter4UnlockedAt',
    ];

    const [conversation, textMessageCount] = await Promise.all([
      prisma.conversation.findUnique({
        where: { id: conversationId },
        select: {
          textMessageCount: true,
          revealLevel: true,
          chapter1UnlockedAt: true,
          chapter2UnlockedAt: true,
          chapter3UnlockedAt: true,
          chapter4UnlockedAt: true,
        },
      }),
      prisma.message.count({
        where: {
          conversationId,
          type: 'TEXT',
        },
      }),
    ]);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const revealLevel = computeRevealLevel(textMessageCount);
    const now = new Date();

    const updates: Prisma.ConversationUpdateInput = {
      textMessageCount,
      revealLevel,
    };
    const chapterUpdates: Partial<Record<ChapterKey, Date>> = {};

    if (textMessageCount >= CHAPTER_THRESHOLDS[1] && !conversation.chapter1UnlockedAt) {
      updates.chapter1UnlockedAt = now;
      chapterUpdates.chapter1UnlockedAt = now;
    }
    if (textMessageCount >= CHAPTER_THRESHOLDS[2] && !conversation.chapter2UnlockedAt) {
      updates.chapter2UnlockedAt = now;
      chapterUpdates.chapter2UnlockedAt = now;
    }
    if (textMessageCount >= CHAPTER_THRESHOLDS[3] && !conversation.chapter3UnlockedAt) {
      updates.chapter3UnlockedAt = now;
      chapterUpdates.chapter3UnlockedAt = now;
    }
    if (textMessageCount >= CHAPTER_THRESHOLDS[4] && !conversation.chapter4UnlockedAt) {
      updates.chapter4UnlockedAt = now;
      chapterUpdates.chapter4UnlockedAt = now;
    }

    const shouldUpdate =
      conversation.textMessageCount !== textMessageCount ||
      conversation.revealLevel !== revealLevel ||
      updates.chapter1UnlockedAt ||
      updates.chapter2UnlockedAt ||
      updates.chapter3UnlockedAt ||
      updates.chapter4UnlockedAt;

    if (shouldUpdate) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: updates,
      });
    }

    const chapterUnlocks: Record<ChapterKey, Date | null> = {
      chapter1UnlockedAt: null,
      chapter2UnlockedAt: null,
      chapter3UnlockedAt: null,
      chapter4UnlockedAt: null,
    };

    chapterKeys.forEach((key) => {
      const nextValue = chapterUpdates[key];
      const previousValue = conversation[key];
      chapterUnlocks[key] = previousValue ?? nextValue ?? null;
    });

    return {
      textMessageCount,
      revealLevel,
      ...chapterUnlocks,
    };
  }
}
