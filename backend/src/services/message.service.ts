import prisma from '../config/database';
import { MessageType, Prisma } from '@prisma/client';
import { ChapterNumber, MessageEnvelope, RevealLevel, SystemMessagePayload } from '../types';
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
      const result = await prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
          data: {
            conversationId,
            senderId,
            type: MessageType.TEXT,
            content,
          },
        });

        const unlockTime =
          message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt as unknown as string);

        const updatedRows = await tx.$queryRaw<
          Array<{
            textMessageCount: number;
            revealLevel: number;
            chapter1UnlockedAt: Date | null;
            chapter2UnlockedAt: Date | null;
            chapter3UnlockedAt: Date | null;
            chapter4UnlockedAt: Date | null;
            user1Id: string;
            user2Id: string;
            chapter: number;
            chapterChanged: boolean;
          }>
        >(Prisma.sql`
          WITH pre AS (
            SELECT
              "id",
              "textMessageCount",
              "revealLevel",
              "chapter1UnlockedAt",
              "chapter2UnlockedAt",
              "chapter3UnlockedAt",
              "chapter4UnlockedAt",
              "user1Id",
              "user2Id"
            FROM "Conversation"
            WHERE "id" = ${conversationId}
            FOR UPDATE
          ),
          calc AS (
            SELECT
              pre."id",
              pre."textMessageCount" + 1 AS new_count,
              CASE
                WHEN pre."textMessageCount" + 1 >= 80 THEN 4
                WHEN pre."textMessageCount" + 1 >= 50 THEN 3
                WHEN pre."textMessageCount" + 1 >= 30 THEN 2
                WHEN pre."textMessageCount" + 1 >= 10 THEN 1
                ELSE 0
              END AS new_chapter
            FROM pre
          )
          UPDATE "Conversation" AS c
          SET
            "textMessageCount" = calc.new_count,
            "revealLevel" = CASE
              WHEN calc.new_chapter > pre."revealLevel" THEN calc.new_chapter
              ELSE pre."revealLevel"
            END,
            "chapter1UnlockedAt" = CASE
              WHEN calc.new_chapter = 1 AND calc.new_chapter > pre."revealLevel" THEN COALESCE(pre."chapter1UnlockedAt", ${unlockTime})
              ELSE pre."chapter1UnlockedAt"
            END,
            "chapter2UnlockedAt" = CASE
              WHEN calc.new_chapter = 2 AND calc.new_chapter > pre."revealLevel" THEN COALESCE(pre."chapter2UnlockedAt", ${unlockTime})
              ELSE pre."chapter2UnlockedAt"
            END,
            "chapter3UnlockedAt" = CASE
              WHEN calc.new_chapter = 3 AND calc.new_chapter > pre."revealLevel" THEN COALESCE(pre."chapter3UnlockedAt", ${unlockTime})
              ELSE pre."chapter3UnlockedAt"
            END,
            "chapter4UnlockedAt" = CASE
              WHEN calc.new_chapter = 4 AND calc.new_chapter > pre."revealLevel" THEN COALESCE(pre."chapter4UnlockedAt", ${unlockTime})
              ELSE pre."chapter4UnlockedAt"
            END
          FROM pre
          JOIN calc ON calc."id" = pre."id"
          WHERE c."id" = pre."id"
          RETURNING
            c."textMessageCount",
            c."revealLevel",
            c."chapter1UnlockedAt",
            c."chapter2UnlockedAt",
            c."chapter3UnlockedAt",
            c."chapter4UnlockedAt",
            pre."user1Id",
            pre."user2Id",
            calc.new_chapter AS "chapter",
            (calc.new_chapter > pre."revealLevel") AS "chapterChanged"
        `);

        const updatedConversation = updatedRows[0];

        if (!updatedConversation) {
          throw new Error('Conversation introuvable');
        }

        if (updatedConversation.user1Id !== senderId && updatedConversation.user2Id !== senderId) {
          throw new Error('Unauthorized access to conversation');
        }

        const chapter = MessageService.clampChapterNumber(updatedConversation.chapter ?? 0);
        const finalRevealLevel = MessageService.clampChapterNumber(updatedConversation.revealLevel ?? 0) as RevealLevel;
        const chapterChanged = Boolean(updatedConversation.chapterChanged);

        const systemMessage: SystemMessagePayload | undefined = chapterChanged
          ? {
              id: `${message.id}-chapter-${chapter}`,
              conversationId,
              senderId: updatedConversation.user1Id,
              type: 'SYSTEM',
              content: getChapterSystemLabel(chapter),
              createdAt: unlockTime.toISOString(),
            }
          : undefined;

        return {
          message,
          textMessageCount: updatedConversation.textMessageCount,
          revealLevel: finalRevealLevel,
          chapter,
          chapterChanged,
          systemMessage,
        };
      });

      return result;
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
