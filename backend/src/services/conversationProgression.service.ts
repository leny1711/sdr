import prisma from '../config/database';
import { CHAPTER_THRESHOLDS, computeRevealLevel } from '../utils/reveal.utils';
import { Prisma } from '@prisma/client';

export class ConversationProgressionService {
  static async recompute(conversationId: string) {
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

    if (textMessageCount >= CHAPTER_THRESHOLDS[1] && !conversation.chapter1UnlockedAt) {
      updates.chapter1UnlockedAt = now;
    }
    if (textMessageCount >= CHAPTER_THRESHOLDS[2] && !conversation.chapter2UnlockedAt) {
      updates.chapter2UnlockedAt = now;
    }
    if (textMessageCount >= CHAPTER_THRESHOLDS[3] && !conversation.chapter3UnlockedAt) {
      updates.chapter3UnlockedAt = now;
    }
    if (textMessageCount >= CHAPTER_THRESHOLDS[4] && !conversation.chapter4UnlockedAt) {
      updates.chapter4UnlockedAt = now;
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

    const chapterUnlocks: Record<string, Date | null> = {};
    [1, 2, 3, 4].forEach((chapter) => {
      const key = `chapter${chapter}UnlockedAt` as const;
      const nextValue = (updates as Record<string, Date | undefined>)[key];
      // @ts-ignore - index access on selected conversation shape
      const previousValue = conversation[key] as Date | null | undefined;
      chapterUnlocks[key] = previousValue ?? nextValue ?? null;
    });

    return {
      textMessageCount,
      revealLevel,
      ...chapterUnlocks,
    };
  }
}
