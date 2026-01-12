import prisma from '../config/database';
import { MessageType } from '@prisma/client';
import { ChapterNumber, MessageEnvelope, SystemMessagePayload } from '../types';
import { getChapterSystemLabel } from '../utils/reveal.utils';

export class MessageService {
  private static conversationLocks = new Map<string, Promise<void>>();
  private static lastMessageTimestamps = new Map<string, number>();
  private static readonly MIN_MESSAGE_INTERVAL_MS = 400;

  private static clampChapterNumber(value: number): ChapterNumber {
    if (value >= 4) return 4;
    if (value >= 3) return 3;
    if (value >= 2) return 2;
    if (value >= 1) return 1;
    return 0;
  }

  private static async withConversationLock<T>(conversationId: string, task: () => Promise<T>): Promise<T> {
    const previous = this.conversationLocks.get(conversationId) ?? Promise.resolve();
    let release: () => void = () => {};
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chained = previous.then(() => current);
    this.conversationLocks.set(conversationId, chained);
    await previous;
    try {
      return await task();
    } finally {
      release();
      if (this.conversationLocks.get(conversationId) === chained) {
        this.conversationLocks.delete(conversationId);
      }
    }
  }

  private static async enforceRateLimit(conversationId: string) {
    const now = Date.now();
    const last = this.lastMessageTimestamps.get(conversationId) ?? 0;
    const delta = now - last;
    if (delta < this.MIN_MESSAGE_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, this.MIN_MESSAGE_INTERVAL_MS - delta));
    }
    this.lastMessageTimestamps.set(conversationId, Date.now());
  }

  static async sendTextMessage(conversationId: string, senderId: string, content: string): Promise<MessageEnvelope> {
    return this.withConversationLock(conversationId, async () => {
      await this.enforceRateLimit(conversationId);
      const resolveChapterFromCount = (count: number): ChapterNumber => {
        if (count >= 80) return 4;
        if (count >= 50) return 3;
        if (count >= 30) return 2;
        if (count >= 10) return 1;
        return 0;
      };
      type ConversationProgress = {
        textMessageCount: number;
        revealLevel: number;
        chapter1UnlockedAt: Date | null;
        chapter2UnlockedAt: Date | null;
        chapter3UnlockedAt: Date | null;
        chapter4UnlockedAt: Date | null;
      };
      const thresholds: Array<{
        value: number;
        chapter: ChapterNumber;
        field: keyof Pick<
          ConversationProgress,
          'chapter1UnlockedAt' | 'chapter2UnlockedAt' | 'chapter3UnlockedAt' | 'chapter4UnlockedAt'
        >;
      }> = [
        { value: 10, chapter: 1, field: 'chapter1UnlockedAt' },
        { value: 30, chapter: 2, field: 'chapter2UnlockedAt' },
        { value: 50, chapter: 3, field: 'chapter3UnlockedAt' },
        { value: 80, chapter: 4, field: 'chapter4UnlockedAt' },
      ];

      return prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
          data: {
            conversationId,
            senderId,
            type: MessageType.TEXT,
            content,
          },
        });

        const [progress] = await tx.$queryRaw<ConversationProgress[]>`
          UPDATE "Conversation"
          SET
            "textMessageCount" = "textMessageCount" + 1,
            "revealLevel" = CASE
              WHEN ("textMessageCount" + 1) >= 80 AND "revealLevel" < 4 THEN 4
              WHEN ("textMessageCount" + 1) >= 50 AND "revealLevel" < 3 THEN 3
              WHEN ("textMessageCount" + 1) >= 30 AND "revealLevel" < 2 THEN 2
              WHEN ("textMessageCount" + 1) >= 10 AND "revealLevel" < 1 THEN 1
              ELSE "revealLevel"
            END,
            "chapter1UnlockedAt" = CASE
              WHEN ("textMessageCount" + 1) >= 10 AND "chapter1UnlockedAt" IS NULL THEN now()
              ELSE "chapter1UnlockedAt"
            END,
            "chapter2UnlockedAt" = CASE
              WHEN ("textMessageCount" + 1) >= 30 AND "chapter2UnlockedAt" IS NULL THEN now()
              ELSE "chapter2UnlockedAt"
            END,
            "chapter3UnlockedAt" = CASE
              WHEN ("textMessageCount" + 1) >= 50 AND "chapter3UnlockedAt" IS NULL THEN now()
              ELSE "chapter3UnlockedAt"
            END,
            "chapter4UnlockedAt" = CASE
              WHEN ("textMessageCount" + 1) >= 80 AND "chapter4UnlockedAt" IS NULL THEN now()
              ELSE "chapter4UnlockedAt"
            END
          WHERE "id" = ${conversationId}
          RETURNING "textMessageCount", "revealLevel", "chapter1UnlockedAt", "chapter2UnlockedAt", "chapter3UnlockedAt", "chapter4UnlockedAt";
        `;

        if (!progress) {
          throw new Error('Conversation introuvable');
        }

        const textMessageCount = progress.textMessageCount;
        const chapter = resolveChapterFromCount(textMessageCount);
        const previousChapter = resolveChapterFromCount(textMessageCount - 1);
        const threshold = thresholds.find((item) => item.chapter === chapter);
        const unlockedAt =
          threshold && chapter > 0 ? progress[threshold.field] : null;
        const chapterChanged = Boolean(threshold && chapter > previousChapter && unlockedAt);

        const systemMessage: SystemMessagePayload | undefined = chapterChanged
          ? {
              id: `${message.id}-system-${chapter}`,
              conversationId,
              senderId,
              type: 'SYSTEM',
              content: getChapterSystemLabel(chapter),
              createdAt: (unlockedAt ?? new Date()).toISOString(),
            }
          : undefined;

        return {
          message,
          revealLevel: MessageService.clampChapterNumber(progress.revealLevel ?? 0),
          textMessageCount,
          chapter,
          chapterChanged,
          systemMessage,
        };
      });
    });
  }

  static async sendVoiceMessage(
    conversationId: string,
    senderId: string,
    audioUrl: string,
    audioDuration: number
  ) {
    return this.withConversationLock(conversationId, async () => {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
        throw new Error('Unauthorized access to conversation');
      }

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          type: MessageType.VOICE,
          audioUrl,
          audioDuration,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
        },
      });

      return message;
    });
  }
}
