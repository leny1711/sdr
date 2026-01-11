import prisma from '../config/database';
import { MessageType } from '@prisma/client';
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

  private static getUnlockField(chapter: ChapterNumber) {
    switch (chapter) {
      case 1:
        return 'chapter1UnlockedAt' as const;
      case 2:
        return 'chapter2UnlockedAt' as const;
      case 3:
        return 'chapter3UnlockedAt' as const;
      default:
        return 'chapter4UnlockedAt' as const;
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
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          type: MessageType.TEXT,
          content,
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

      const updatedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          textMessageCount: {
            increment: 1,
          },
        },
        select: {
          textMessageCount: true,
          revealLevel: true,
          chapter1UnlockedAt: true,
          chapter2UnlockedAt: true,
          chapter3UnlockedAt: true,
          chapter4UnlockedAt: true,
          user1Id: true,
          user2Id: true,
        },
      });

      if (updatedConversation.user1Id !== senderId && updatedConversation.user2Id !== senderId) {
        throw new Error('Unauthorized access to conversation');
      }

      const textMessageCount = updatedConversation.textMessageCount;
      const resolveChapterFromCount = (count: number): ChapterNumber => {
        if (count >= 80) return 4;
        if (count >= 50) return 3;
        if (count >= 30) return 2;
        if (count >= 10) return 1;
        return 0;
      };
      type UnlockField = ReturnType<typeof MessageService.getUnlockField>;
      const nextChapter = resolveChapterFromCount(textMessageCount);
      const currentRevealLevel = MessageService.clampChapterNumber(updatedConversation.revealLevel ?? 0);
      const unlockField = nextChapter > 0 ? MessageService.getUnlockField(nextChapter) : undefined;
      const unlockedAt: Date | null | undefined = unlockField ? updatedConversation[unlockField] : undefined;
      const alreadyUnlocked = unlockField ? Boolean(unlockedAt) : true;
      const chapterChanged = Boolean(nextChapter && !alreadyUnlocked && nextChapter > currentRevealLevel);

      let finalRevealLevel: RevealLevel = MessageService.clampChapterNumber(
        Math.max(currentRevealLevel, resolveChapterFromCount(textMessageCount))
      );
      let systemMessage: SystemMessagePayload | undefined;

      if (chapterChanged && unlockField) {
        const unlockTime = new Date(message.createdAt.getTime() + 1);
        const progressionData: { revealLevel: number } & Partial<Record<UnlockField, Date>> = {
          revealLevel: nextChapter,
        };
        if (!unlockedAt) {
          progressionData[unlockField] = unlockTime;
        }

        const progression = await prisma.conversation.update({
          where: { id: conversationId },
          data: progressionData,
          select: {
            revealLevel: true,
            user1Id: true,
          },
        });

        finalRevealLevel = MessageService.clampChapterNumber(progression.revealLevel as RevealLevel);

        const createdSystemMessage = await prisma.message.create({
          data: {
            conversationId,
            senderId: progression.user1Id,
            type: MessageType.SYSTEM,
            content: getChapterSystemLabel(nextChapter),
            createdAt: unlockTime,
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

        systemMessage = {
          id: createdSystemMessage.id,
          conversationId,
          senderId: createdSystemMessage.senderId,
          type: 'SYSTEM',
          content: createdSystemMessage.content ?? getChapterSystemLabel(nextChapter),
          createdAt:
            createdSystemMessage.createdAt instanceof Date
              ? createdSystemMessage.createdAt.toISOString()
              : createdSystemMessage.createdAt,
        };
      }

      return {
        message,
        revealLevel: finalRevealLevel,
        textMessageCount,
        chapter: nextChapter,
        chapterChanged,
        systemMessage,
      };
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
