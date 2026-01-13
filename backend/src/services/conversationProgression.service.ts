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

    const chapterThresholds: Array<{ key: ChapterKey; threshold: number }> = [
      { key: 'chapter1UnlockedAt', threshold: CHAPTER_THRESHOLDS[1] },
      { key: 'chapter2UnlockedAt', threshold: CHAPTER_THRESHOLDS[2] },
      { key: 'chapter3UnlockedAt', threshold: CHAPTER_THRESHOLDS[3] },
      { key: 'chapter4UnlockedAt', threshold: CHAPTER_THRESHOLDS[4] },
    ];

    chapterThresholds.forEach(({ key, threshold }) => {
      if (textMessageCount >= threshold && !conversation[key]) {
        const timestamp = now;
        chapterUpdates[key] = timestamp;
      }
    });

    const shouldUpdate =
      conversation.textMessageCount !== textMessageCount ||
      conversation.revealLevel !== revealLevel ||
      Object.keys(chapterUpdates).length > 0;

    if (shouldUpdate) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { ...updates, ...chapterUpdates },
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
      chapterUnlocks[key] = nextValue ?? previousValue ?? null;
    });

    return {
      textMessageCount,
      revealLevel,
      ...chapterUnlocks,
    };
  }
}
